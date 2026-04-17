import { locationRepository } from "@/lib/repositories/locationRepository";
import { organisationRepository } from "@/lib/repositories/organisationRepository";
import { userRepository } from "@/lib/repositories/userRepository";

export interface FormOrganisationOption {
  id: string;
  name: string;
  type: string;
}

export interface FormUserOption {
  id: string;
  name: string;
  role: string;
  organisationId: string;
}

export interface FormLocationOption {
  id: string;
  name: string;
  type: string;
  organisationId: string;
}

export class ReferenceDataService {
  async getFormOptions() {
    const [organisations, users, locations] = await Promise.all([
      organisationRepository.list(),
      userRepository.list(),
      locationRepository.list()
    ]);

    return {
      organisations: organisations
        .map((organisation) => ({
          id: organisation.id,
          name: organisation.name,
          type: organisation.type
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      users: users
        .map((user) => ({
          id: user.id,
          name: user.name,
          role: user.role,
          organisationId: user.organisationId
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      locations: locations
        .map((location) => ({
          id: location.id,
          name: location.name,
          type: location.type,
          organisationId: location.organisationId
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    };
  }
}

export const referenceDataService = new ReferenceDataService();
