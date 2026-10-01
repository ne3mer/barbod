import type {
  BaseAppointmentEmailData,
  AppointmentRescheduledEmailData,
  BarberDailyDigestEmailData,
  EmailLocale,
} from '../types';


/**
  Luxury obsidian email wrapper with inline CSS for cross-client compatibility.
 */
function emailLayout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #121215; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Branding -->
          <tr>
            <td style="background-color: #09090b; padding: 32px; text-align: center; border-bottom: 1px solid #27272a;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.15em; color: #f4f4f5; text-transform: uppercase;">
                BARBOD <span style="color: #d4af37;">BARBER</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 0.25em; color: #a1a1aa; text-transform: uppercase;">
                Luxury Grooming Atelier
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #09090b; padding: 24px 32px; text-align: center; border-top: 1px solid #27272a;">
              <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                &copy; ${new Date().getFullYear()} Barbod Barber Studio. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #52525b;">
                Budapest, Hungary &bull; Europe/Budapest
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderDetailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 13px; color: #a1a1aa; width: 40%; font-weight: 500;">
      ${label}
    </td>
    <td style="padding: 10px 0; border-bottom: 1px solid #27272a; font-size: 14px; color: #f4f4f5; font-weight: 600; text-align: right;">
      ${value}
    </td>
  </tr>`;
}

// 1. APPOINTMENT BOOKED (Customer)
export function renderAppointmentBookedEmail(data: BaseAppointmentEmailData, locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const title = isHu ? 'Foglalás visszaigazolása' : 'Booking Confirmation';
  const subject = isHu
    ? `Időpont foglalás - ${data.serviceName} (${data.dateStr} ${data.timeStr})`
    : `Appointment Booked - ${data.serviceName} (${data.dateStr} ${data.timeStr})`;

  const body = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? 'Köszönjük a foglalást!' : 'Thank you for your booking!'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu
        ? `Kedves ${data.customerName}! A foglalásod sikeresen rögzítésre került. Szeretettel várunk szalonunkban.`
        : `Dear ${data.customerName}, your appointment has been successfully booked. We look forward to welcoming you.`}
    </p>

    <!-- Details Card -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${renderDetailRow(isHu ? 'Szolgáltatás' : 'Service', data.serviceName)}
      ${renderDetailRow(isHu ? 'Borbély' : 'Barber', data.barberName)}
      ${renderDetailRow(isHu ? 'Dátum' : 'Date', data.dateStr)}
      ${renderDetailRow(isHu ? 'Időpont' : 'Time', data.timeStr)}
      ${renderDetailRow(isHu ? 'Időtartam' : 'Duration', `${data.durationMinutes} ${isHu ? 'perc' : 'mins'}`)}
      ${data.studioAddress ? renderDetailRow(isHu ? 'Cím' : 'Address', data.studioAddress) : ''}
    </table>

    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5; text-align: center;">
      ${isHu
        ? 'Ha módosítani vagy törölni szeretnéd az időpontodat, kérjük lépj kapcsolatba velünk legalább 24 órával a lefoglalt időpont előtt.'
        : 'If you need to reschedule or cancel, please contact us at least 24 hours prior to your scheduled time.'}
    </p>
  `;

  return { subject, html: emailLayout(title, body) };
}

// 2. APPOINTMENT CONFIRMED (Customer)
export function renderAppointmentConfirmedEmail(data: BaseAppointmentEmailData, locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const title = isHu ? 'Időpont megerősítve' : 'Appointment Confirmed';
  const subject = isHu
    ? `Időpont megerősítve - ${data.serviceName} (${data.dateStr} ${data.timeStr})`
    : `Appointment Confirmed - ${data.serviceName} (${data.dateStr} ${data.timeStr})`;

  const body = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; padding: 6px 16px; background-color: #064e3b; color: #34d399; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 20px;">
        ${isHu ? 'Megerősítve' : 'Confirmed'}
      </span>
    </div>

    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? 'Az időpontod megerősítésre került' : 'Your appointment is confirmed'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu
        ? `Kedves ${data.customerName}! Örömmel értesítünk, hogy az időpontodat megerősítettük.`
        : `Dear ${data.customerName}, we are pleased to confirm that your appointment is confirmed.`}
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${renderDetailRow(isHu ? 'Szolgáltatás' : 'Service', data.serviceName)}
      ${renderDetailRow(isHu ? 'Borbély' : 'Barber', data.barberName)}
      ${renderDetailRow(isHu ? 'Dátum' : 'Date', data.dateStr)}
      ${renderDetailRow(isHu ? 'Időpont' : 'Time', data.timeStr)}
      ${data.studioAddress ? renderDetailRow(isHu ? 'Cím' : 'Address', data.studioAddress) : ''}
    </table>
  `;

  return { subject, html: emailLayout(title, body) };
}

// 3. APPOINTMENT CANCELLED (Customer)
export function renderAppointmentCancelledEmail(data: BaseAppointmentEmailData, locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const title = isHu ? 'Időpont törölve' : 'Appointment Cancelled';
  const subject = isHu
    ? `Időpont törölve - ${data.serviceName} (${data.dateStr})`
    : `Appointment Cancelled - ${data.serviceName} (${data.dateStr})`;

  const body = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; padding: 6px 16px; background-color: #450a0a; color: #f87171; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 20px;">
        ${isHu ? 'Törölve' : 'Cancelled'}
      </span>
    </div>

    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? 'Az időpontod törlésre került' : 'Your appointment has been cancelled'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu
        ? `Kedves ${data.customerName}! Értesítünk, hogy az alábbi időpontod törlésre került.`
        : `Dear ${data.customerName}, please note that your appointment below has been cancelled.`}
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${renderDetailRow(isHu ? 'Szolgáltatás' : 'Service', data.serviceName)}
      ${renderDetailRow(isHu ? 'Borbély' : 'Barber', data.barberName)}
      ${renderDetailRow(isHu ? 'Eredeti dátum' : 'Original Date', data.dateStr)}
      ${renderDetailRow(isHu ? 'Eredeti időpont' : 'Original Time', data.timeStr)}
    </table>

    <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5; text-align: center;">
      ${isHu
        ? 'Ha új időpontot szeretnél foglalni, látogass el weboldalunkra.'
        : 'If you would like to book a new appointment, please visit our website.'}
    </p>
  `;

  return { subject, html: emailLayout(title, body) };
}

// 4. APPOINTMENT RESCHEDULED (Customer)
export function renderAppointmentRescheduledEmail(data: AppointmentRescheduledEmailData, locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const title = isHu ? 'Időpont módosítva' : 'Appointment Rescheduled';
  const subject = isHu
    ? `Időpont módosítva - ${data.serviceName} (${data.dateStr} ${data.timeStr})`
    : `Appointment Rescheduled - ${data.serviceName} (${data.dateStr} ${data.timeStr})`;

  const body = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? 'Az időpontod módosult' : 'Your appointment has been rescheduled'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu
        ? `Kedves ${data.customerName}! Az alábbiakban láthatod a módosított időpont részleteit.`
        : `Dear ${data.customerName}, your appointment details have been updated as follows.`}
    </p>

    <!-- Comparison -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="width: 48%; background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 14px 16px; text-decoration: line-through; color: #71717a;">
          <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #a1a1aa; text-decoration: none;">
            ${isHu ? 'Korábbi időpont' : 'Previous'}
          </p>
          <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 600;">
            ${data.previousDateStr} ${data.previousTimeStr}
          </p>
        </td>
        <td style="width: 4%;"></td>
        <td style="width: 48%; background-color: #18181b; border: 1px solid #d4af37; border-radius: 8px; padding: 14px 16px; color: #f4f4f5;">
          <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #d4af37;">
            ${isHu ? 'Új időpont' : 'New Time'}
          </p>
          <p style="margin: 6px 0 0 0; font-size: 13px; font-weight: 700;">
            ${data.dateStr} ${data.timeStr}
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${renderDetailRow(isHu ? 'Szolgáltatás' : 'Service', data.serviceName)}
      ${renderDetailRow(isHu ? 'Borbély' : 'Barber', data.barberName)}
      ${data.studioAddress ? renderDetailRow(isHu ? 'Cím' : 'Address', data.studioAddress) : ''}
    </table>
  `;

  return { subject, html: emailLayout(title, body) };
}

// 5. CUSTOMER REMINDER (24h / 2h)
export function renderCustomerReminderEmail(data: BaseAppointmentEmailData, type: '24h' | '2h', locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const hoursText = type === '24h' ? (isHu ? '24 óra' : '24 hours') : (isHu ? '2 óra' : '2 hours');
  const title = isHu ? `Emlékeztető (${hoursText})` : `Reminder (${hoursText})`;
  const subject = isHu
    ? `Emlékeztető: Időpontod van hamarosan (${data.dateStr} ${data.timeStr})`
    : `Reminder: Upcoming Appointment (${data.dateStr} ${data.timeStr})`;

  const body = `
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="display: inline-block; padding: 6px 16px; background-color: #1e1b4b; color: #a5b4fc; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 20px;">
        ${isHu ? `Hamarosan (${hoursText})` : `Upcoming (${hoursText})`}
      </span>
    </div>

    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? 'Várunk a szalonban!' : 'We are waiting for you!'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu
        ? `Kedves ${data.customerName}! Emlékeztetőül küldjük, hogy kb. ${hoursText} múlva esedékes az alábbi időpontod.`
        : `Dear ${data.customerName}, this is a friendly reminder that your appointment is in approximately ${hoursText}.`}
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${renderDetailRow(isHu ? 'Szolgáltatás' : 'Service', data.serviceName)}
      ${renderDetailRow(isHu ? 'Borbély' : 'Barber', data.barberName)}
      ${renderDetailRow(isHu ? 'Dátum' : 'Date', data.dateStr)}
      ${renderDetailRow(isHu ? 'Időpont' : 'Time', data.timeStr)}
      ${data.studioAddress ? renderDetailRow(isHu ? 'Cím' : 'Address', data.studioAddress) : ''}
    </table>
  `;

  return { subject, html: emailLayout(title, body) };
}

// 6. BARBER NEW APPOINTMENT
export function renderBarberNewAppointmentEmail(data: BaseAppointmentEmailData, locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const title = isHu ? 'Új időpont foglalás' : 'New Appointment Booked';
  const subject = `[Új foglalás] ${data.customerName} - ${data.serviceName} (${data.dateStr} ${data.timeStr})`;

  const body = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? 'Új foglalás érkezett!' : 'New Appointment Notification'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu ? `Szia ${data.barberName}, új időpontot foglaltak hozzád:` : `Hello ${data.barberName}, a new appointment has been scheduled with you:`}
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${renderDetailRow(isHu ? 'Vendég' : 'Customer', data.customerName)}
      ${renderDetailRow(isHu ? 'E-mail' : 'Email', data.customerEmail)}
      ${data.customerPhone ? renderDetailRow(isHu ? 'Telefon' : 'Phone', data.customerPhone) : ''}
      ${renderDetailRow(isHu ? 'Szolgáltatás' : 'Service', data.serviceName)}
      ${renderDetailRow(isHu ? 'Dátum' : 'Date', data.dateStr)}
      ${renderDetailRow(isHu ? 'Időpont' : 'Time', data.timeStr)}
      ${renderDetailRow(isHu ? 'Időtartam' : 'Duration', `${data.durationMinutes} ${isHu ? 'perc' : 'mins'}`)}
      ${data.note ? renderDetailRow(isHu ? 'Megjegyzés' : 'Note', data.note) : ''}
    </table>
  `;

  return { subject, html: emailLayout(title, body) };
}

// 7. BARBER CANCELLATION
export function renderBarberCancellationEmail(data: BaseAppointmentEmailData, locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const title = isHu ? 'Időpont törölve' : 'Appointment Cancelled';
  const subject = `[Törölve] ${data.customerName} - ${data.dateStr} ${data.timeStr}`;

  const body = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? 'Egy időpontot töröltek' : 'An appointment was cancelled'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu ? `Szia ${data.barberName}, az alábbi időpont törlésre került:` : `Hello ${data.barberName}, the following appointment has been cancelled:`}
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${renderDetailRow(isHu ? 'Vendég' : 'Customer', data.customerName)}
      ${renderDetailRow(isHu ? 'Szolgáltatás' : 'Service', data.serviceName)}
      ${renderDetailRow(isHu ? 'Eredeti dátum' : 'Original Date', data.dateStr)}
      ${renderDetailRow(isHu ? 'Eredeti időpont' : 'Original Time', data.timeStr)}
    </table>
  `;

  return { subject, html: emailLayout(title, body) };
}

// 8. BARBER RESCHEDULE
export function renderBarberRescheduleEmail(data: AppointmentRescheduledEmailData, locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const title = isHu ? 'Időpont módosult' : 'Appointment Rescheduled';
  const subject = `[Módosítva] ${data.customerName} - Új időpont: ${data.dateStr} ${data.timeStr}`;

  const body = `
    <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? 'Időpont módosult' : 'Appointment Rescheduled'}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu ? `Szia ${data.barberName}, ${data.customerName} időpontja megváltozott.` : `Hello ${data.barberName}, ${data.customerName}'s appointment was rescheduled.`}
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${renderDetailRow(isHu ? 'Vendég' : 'Customer', data.customerName)}
      ${renderDetailRow(isHu ? 'Új dátum' : 'New Date', data.dateStr)}
      ${renderDetailRow(isHu ? 'Új időpont' : 'New Time', data.timeStr)}
      ${renderDetailRow(isHu ? 'Korábbi időpont' : 'Previous Time', `${data.previousDateStr} ${data.previousTimeStr}`)}
    </table>
  `;

  return { subject, html: emailLayout(title, body) };
}

// 9. BARBER DAILY DIGEST
export function renderBarberDailyDigestEmail(data: BarberDailyDigestEmailData, locale: EmailLocale = 'hu') {
  const isHu = locale === 'hu';
  const title = isHu ? 'Napi beosztás' : 'Daily Schedule Digest';
  const subject = isHu
    ? `Napi beosztás (${data.dateStr}) - ${data.totalAppointments} időpont`
    : `Daily Schedule (${data.dateStr}) - ${data.totalAppointments} appointments`;

  const rowsHtml = data.appointments
    .map(
      (app) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #27272a; font-size: 14px; font-weight: 700; color: #d4af37; width: 25%;">
        ${app.timeStr}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #27272a; font-size: 14px; color: #f4f4f5; font-weight: 600; width: 40%;">
        ${app.customerName}
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #27272a; font-size: 13px; color: #a1a1aa; text-align: right; width: 35%;">
        ${app.serviceName} (${app.durationMinutes}m)
      </td>
    </tr>`
    )
    .join('');

  const body = `
    <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #f4f4f5; text-align: center;">
      ${isHu ? `Jó reggelt, ${data.barberName}!` : `Good morning, ${data.barberName}!`}
    </h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6; text-align: center;">
      ${isHu
        ? `A mai napra (${data.dateStr}) összesen <strong style="color: #f4f4f5;">${data.totalAppointments} időpontod</strong> van.`
        : `For today (${data.dateStr}), you have <strong style="color: #f4f4f5;">${data.totalAppointments} appointment(s)</strong>.`}
    </p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      ${rowsHtml}
    </table>
  `;

  return { subject, html: emailLayout(title, body) };
}
