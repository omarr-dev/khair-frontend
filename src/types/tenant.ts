/**
 * Tenant/Association types for multi-tenancy support
 */

export interface Tenant {
    id: number;
    name: string;
    displayName?: string;
    logoUrl?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
}

export interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string | null;
    subdomain: string | null;
    isResolved: boolean;
}
