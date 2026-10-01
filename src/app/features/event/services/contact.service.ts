import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../../config/emailjs.config';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  /**
   * Envoie un message depuis le formulaire de contact vers l'organisation DevFest Kivu
   */
  async sendContactMessage(formData: ContactFormData): Promise<void> {
    const templateParams = {
      from_name: formData.name,
      from_email: formData.email,
      subject: formData.subject,
      message: formData.message,
      to_email: EMAILJS_CONFIG.recipientEmail,
    };

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.contact,
      templateParams,
      EMAILJS_CONFIG.publicKey,
    );
  }

  /**
   * Envoie une notification d'inscription à la newsletter (Pied de page)
   */
  async subscribeNewsletter(subscriberEmail: string): Promise<void> {
    const templateParams = {
      subscriber_email: subscriberEmail,
      subscription_date: new Date().toLocaleString('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
      }),
      to_email: EMAILJS_CONFIG.recipientEmail,
    };

    // Si le template newsletter n'est pas encore configuré, on utilise le template contact avec un sujet par défaut
    const templateId =
      EMAILJS_CONFIG.templates.newsletter &&
      EMAILJS_CONFIG.templates.newsletter !== 'VOTRE_TEMPLATE_NEWS'
        ? EMAILJS_CONFIG.templates.newsletter
        : EMAILJS_CONFIG.templates.contact;

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey,
    );
  }
}
