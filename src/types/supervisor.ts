/** A HalaqaSupervisor user as returned by the supervisors endpoints. */
export interface HalaqaSupervisor {
  id: number;
  fullName: string;
  phoneNumber: string;
  role: string;
  /** IDs of the halaqat this supervisor is assigned to. */
  supervisedHalaqaIds: number[];
}

export interface CreateSupervisorDto {
  fullName: string;
  phoneNumber: string;
}

export interface UpdateSupervisorDto {
  fullName: string;
  phoneNumber: string;
}
