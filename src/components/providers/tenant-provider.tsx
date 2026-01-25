"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenant, TenantContextType } from '@/types/tenant';
import { resolveTenant } from '@/services/tenant.service';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// List of subdomains to ignore (not actual tenants)
const IGNORED_SUBDOMAINS = ['www', 'localhost', 'api', 'admin', 'app'];

// List of root domains (not subdomains)
const ROOT_DOMAINS = ['maarij.sa', 'localhost', '127.0.0.1'];

// Cache TTL: 24 hours in milliseconds
const TENANT_CACHE_TTL = 24 * 60 * 60 * 1000;

interface CachedTenant {
    data: Tenant;
    timestamp: number;
    subdomain: string;
}

/**
 * Get cached tenant data from localStorage
 */
function getCachedTenant(subdomain: string): Tenant | null {
    if (typeof window === 'undefined') return null;

    try {
        const cached = localStorage.getItem('tenant');
        if (!cached) return null;

        const cachedData: CachedTenant = JSON.parse(cached);

        // Validate: same subdomain and not expired
        const isValid = 
            cachedData.subdomain === subdomain &&
            Date.now() - cachedData.timestamp < TENANT_CACHE_TTL;

        if (isValid) {
            console.log(`[TenantProvider] Using cached tenant data for: ${subdomain}`);
            return cachedData.data;
        }

        // Cache expired or subdomain mismatch
        console.log(`[TenantProvider] Cache invalid or expired for: ${subdomain}`);
        return null;
    } catch (error) {
        console.error('[TenantProvider] Failed to parse cached tenant:', error);
        localStorage.removeItem('tenant');
        return null;
    }
}

/**
 * Save tenant data to localStorage with timestamp
 */
function cacheTenant(tenant: Tenant, subdomain: string): void {
    if (typeof window === 'undefined') return;

    try {
        const cacheData: CachedTenant = {
            data: tenant,
            timestamp: Date.now(),
            subdomain,
        };
        localStorage.setItem('tenant', JSON.stringify(cacheData));
        console.log(`[TenantProvider] Cached tenant data for: ${subdomain}`);
    } catch (error) {
        console.error('[TenantProvider] Failed to cache tenant:', error);
    }
}

/**
 * Extract subdomain from hostname
 * Examples:
 * - khair.maarij.sa -> khair
 * - www.maarij.sa -> null (ignored)
 * - maarij.sa -> null (root domain)
 * - localhost:3000 -> null (development without subdomain)
 * - khair.localhost:3000 -> khair (development with subdomain)
 */
function extractSubdomain(hostname: string): string | null {
    // Remove port if present
    const host = hostname.split(':')[0];

    // Check if it's a root domain
    for (const rootDomain of ROOT_DOMAINS) {
        if (host === rootDomain || host === `www.${rootDomain}`) {
            return null;
        }
    }

    // Split the hostname
    const parts = host.split('.');

    // Need at least 2 parts to have a subdomain (subdomain.domain)
    // For localhost development: khair.localhost
    // For production: khair.maarij.sa
    if (parts.length >= 2) {
        const subdomain = parts[0].toLowerCase();

        // Check if it's an ignored subdomain
        if (IGNORED_SUBDOMAINS.includes(subdomain)) {
            return null;
        }

        return subdomain;
    }

    return null;
}

/**
 * Apply tenant theme colors as CSS variables
 */
function applyTenantTheme(tenant: Tenant) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (tenant.primaryColor) {
        // Convert hex to HSL for shadcn/ui compatibility
        root.style.setProperty('--tenant-primary', tenant.primaryColor);
    }

    if (tenant.secondaryColor) {
        root.style.setProperty('--tenant-secondary', tenant.secondaryColor);
    }
}

/**
 * Helper to update or create a link element in document head
 * Cached references to avoid repeated DOM queries
 */
const linkCache: Record<string, HTMLLinkElement> = {};

function updateLinkElement(rel: string, href: string): void {
    // Check cache first to avoid DOM query
    let link = linkCache[rel];
    
    if (!link) {
        // Query DOM only once per rel type
        const existingLink = document.querySelector(`link[rel='${rel}']`) as HTMLLinkElement | null;
        
        if (existingLink) {
            link = existingLink;
        } else {
            link = document.createElement('link');
            link.rel = rel;
            document.head.appendChild(link);
        }
        
        // Cache for future updates
        linkCache[rel] = link;
    }
    
    // Only update if href changed (avoid unnecessary DOM mutations)
    if (link.href !== href) {
        link.href = href;
    }
}

/**
 * Update document title and favicon based on tenant
 * Called once during tenant resolution - minimal performance impact
 */
function updateDocumentMeta(tenant: Tenant) {
    if (typeof document === 'undefined') return;

    // Update title
    const displayName = tenant.displayName || tenant.name;
    document.title = `${displayName} - نظام إدارة الحلقات القرآنية`;

    // Use favicon if provided, otherwise fall back to logoUrl
    const iconUrl = tenant.favicon || tenant.logoUrl;
    
    if (iconUrl) {
        // Update main favicon (modern browsers)
        updateLinkElement('icon', iconUrl);
        
        // Update apple-touch-icon for iOS home screen
        updateLinkElement('apple-touch-icon', iconUrl);
    }
}

interface TenantProviderProps {
    children: React.ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subdomain, setSubdomain] = useState<string | null>(null);
    const [isResolved, setIsResolved] = useState(false);

    const resolveTenantFromSubdomain = useCallback(async () => {
        // Only run on client side
        if (typeof window === 'undefined') {
            setLoading(false);
            return;
        }

        try {
            // Check for development override via query param or env variable
            const urlParams = new URLSearchParams(window.location.search);
            const devSubdomain = urlParams.get('subdomain') ||
                process.env.NEXT_PUBLIC_DEV_SUBDOMAIN;

            // Extract subdomain from hostname
            const hostname = window.location.hostname;
            const extractedSubdomain = devSubdomain || extractSubdomain(hostname);

            setSubdomain(extractedSubdomain);

            if (!extractedSubdomain) {
                // No subdomain - this might be the main landing page
                console.log('[TenantProvider] No subdomain detected, skipping resolution');
                setLoading(false);
                setIsResolved(true);
                return;
            }

            console.log(`[TenantProvider] Resolving tenant for subdomain: ${extractedSubdomain}`);

            // Check cache first
            const cachedTenantData = getCachedTenant(extractedSubdomain);
            
            if (cachedTenantData) {
                // Use cached data
                setTenant(cachedTenantData);
                localStorage.setItem('tenantId', cachedTenantData.id.toString());
                applyTenantTheme(cachedTenantData);
                updateDocumentMeta(cachedTenantData);
                console.log(`[TenantProvider] Tenant resolved from cache: ${cachedTenantData.name} (ID: ${cachedTenantData.id})`);
            } else {
                // Fetch from API
                const tenantData = await resolveTenant(extractedSubdomain);
                setTenant(tenantData);

                // Store tenant ID in localStorage for API client to use
                localStorage.setItem('tenantId', tenantData.id.toString());

                // Cache the full tenant data
                cacheTenant(tenantData, extractedSubdomain);

                // Apply theme and update meta
                applyTenantTheme(tenantData);
                updateDocumentMeta(tenantData);

                console.log(`[TenantProvider] Tenant resolved from API: ${tenantData.name} (ID: ${tenantData.id})`);
            }
        } catch (err: any) {
            console.error('[TenantProvider] Failed to resolve tenant:', err);

            if (err.response?.status === 404) {
                setError('لم يتم العثور على الجمعية المطلوبة');
            } else if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
                setError('تعذر الاتصال بالخادم');
            } else {
                setError('حدث خطأ أثناء تحميل بيانات الجمعية');
            }
        } finally {
            setLoading(false);
            setIsResolved(true);
        }
    }, []);

    useEffect(() => {
        resolveTenantFromSubdomain();
    }, [resolveTenantFromSubdomain]);

    return (
        <TenantContext.Provider
            value={{
                tenant,
                loading,
                error,
                subdomain,
                isResolved,
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
