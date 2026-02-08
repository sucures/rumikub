// Servicio de Captación de Partners
import { Partner } from '../shared/types.js';

export interface PartnerApplication {
  id: string;
  applicantName: string;
  email: string;
  platform: 'youtube' | 'telegram' | 'twitter' | 'instagram' | 'tiktok' | 'other';
  socialLinks: {
    youtube?: string;
    telegram?: string;
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    website?: string;
  };
  followerCount: {
    youtube?: number;
    telegram?: number;
    twitter?: number;
    instagram?: number;
    tiktok?: number;
  };
  contentType: string;
  whyPartner: string;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface PartnerTier {
  name: string;
  minFollowers: number;
  referralRate: number;
  benefits: string[];
}

export class PartnerAcquisitionService {
  private tiers: PartnerTier[] = [
    {
      name: 'Bronze',
      minFollowers: 1000,
      referralRate: 5,
      benefits: [
        'Código de afiliado único',
        'Dashboard de estadísticas',
        'Comisiones del 5%',
      ],
    },
    {
      name: 'Silver',
      minFollowers: 10000,
      referralRate: 7,
      benefits: [
        'Todo lo de Bronze',
        'Comisiones del 7%',
        'Materiales promocionales',
        'Soporte prioritario',
      ],
    },
    {
      name: 'Gold',
      minFollowers: 50000,
      referralRate: 10,
      benefits: [
        'Todo lo de Silver',
        'Comisiones del 10%',
        'Contenido exclusivo',
        'Acceso a eventos privados',
      ],
    },
    {
      name: 'Platinum',
      minFollowers: 100000,
      referralRate: 15,
      benefits: [
        'Todo lo de Gold',
        'Comisiones del 15%',
        'Recompensas especiales',
        'Colaboraciones exclusivas',
      ],
    },
  ];

  // Aplicar para ser partner
  async submitApplication(application: Partial<PartnerApplication>): Promise<PartnerApplication> {
    const partnerApp: PartnerApplication = {
      id: this.generateApplicationId(),
      applicantName: application.applicantName || '',
      email: application.email || '',
      platform: application.platform || 'other',
      socialLinks: application.socialLinks || {},
      followerCount: application.followerCount || {},
      contentType: application.contentType || '',
      whyPartner: application.whyPartner || '',
      status: 'pending',
      createdAt: new Date(),
    };

    // Validar email
    if (!this.isValidEmail(partnerApp.email)) {
      throw new Error('Email inválido');
    }

    // Verificar si ya existe una aplicación pendiente
    // const existing = await PartnerApplicationModel.findOne({
    //   email: partnerApp.email,
    //   status: 'pending',
    // });
    // if (existing) {
    //   throw new Error('Ya tienes una aplicación pendiente');
    // }

    // Guardar aplicación
    // await PartnerApplicationModel.create(partnerApp);

    // Enviar email de confirmación
    // await this.sendConfirmationEmail(partnerApp);

    // Notificar al equipo
    // await this.notifyTeam(partnerApp);

    return partnerApp;
  }

  // Revisar aplicación
  async reviewApplication(
    applicationId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    // const application = await PartnerApplicationModel.findById(applicationId);
    // if (!application) {
    //   throw new Error('Aplicación no encontrada');
    // }

    // if (application.status !== 'pending') {
    //   throw new Error('La aplicación ya fue revisada');
    // }

    // Determinar tier basado en seguidores
    // const totalFollowers = this.calculateTotalFollowers(application.followerCount);
    // const tier = this.determineTier(totalFollowers);

    if (decision === 'approved') {
      // Crear partner
      // const partner = await partnerService.createPartner({
      //   name: application.applicantName,
      //   type: application.platform,
      //   socialLinks: application.socialLinks,
      //   referralRate: tier.referralRate,
      // });

      // Actualizar aplicación
      // await PartnerApplicationModel.updateOne(
      //   { id: applicationId },
      //   {
      //     $set: {
      //       status: 'approved',
      //       reviewedBy: reviewerId,
      //       reviewedAt: new Date(),
      //       notes,
      //     },
      //   }
      // );

      // Enviar email de aprobación
      // await this.sendApprovalEmail(application, partner);
    } else {
      // Rechazar
      // await PartnerApplicationModel.updateOne(
      //   { id: applicationId },
      //   {
      //     $set: {
      //       status: 'rejected',
      //       reviewedBy: reviewerId,
      //       reviewedAt: new Date(),
      //       notes,
      //     },
      //   }
      // );

      // Enviar email de rechazo
      // await this.sendRejectionEmail(application, notes);
    }
  }

  // Obtener aplicaciones pendientes
  async getPendingApplications(): Promise<PartnerApplication[]> {
    // return await PartnerApplicationModel.find({
    //   status: 'pending',
    // }).sort({ createdAt: -1 });

    return [];
  }

  // Determinar tier basado en seguidores
  determineTier(totalFollowers: number): PartnerTier {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (totalFollowers >= this.tiers[i].minFollowers) {
        return this.tiers[i];
      }
    }
    return this.tiers[0]; // Bronze por defecto
  }

  // Calcular total de seguidores
  calculateTotalFollowers(followerCount: PartnerApplication['followerCount']): number {
    return (
      (followerCount.youtube || 0) +
      (followerCount.telegram || 0) +
      (followerCount.twitter || 0) +
      (followerCount.instagram || 0) +
      (followerCount.tiktok || 0)
    );
  }

  // Obtener información de tier
  getTierInfo(tierName: string): PartnerTier | undefined {
    return this.tiers.find((t) => t.name.toLowerCase() === tierName.toLowerCase());
  }

  // Obtener todos los tiers
  getAllTiers(): PartnerTier[] {
    return this.tiers;
  }

  // Validar email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Enviar email de confirmación
  private async sendConfirmationEmail(application: PartnerApplication): Promise<void> {
    // Implementar envío de email
    console.log('Sending confirmation email to:', application.email);
  }

  // Enviar email de aprobación
  private async sendApprovalEmail(
    application: PartnerApplication,
    partner: Partner
  ): Promise<void> {
    // Implementar envío de email
    console.log('Sending approval email to:', application.email);
  }

  // Enviar email de rechazo
  private async sendRejectionEmail(
    application: PartnerApplication,
    notes?: string
  ): Promise<void> {
    // Implementar envío de email
    console.log('Sending rejection email to:', application.email);
  }

  // Notificar al equipo
  private async notifyTeam(application: PartnerApplication): Promise<void> {
    // Notificar a administradores
    // io.to('admin').emit('new-partner-application', application);
  }

  private generateApplicationId(): string {
    return `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const partnerAcquisitionService = new PartnerAcquisitionService();
