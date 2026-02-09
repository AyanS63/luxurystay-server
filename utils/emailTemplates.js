export const getEmailTemplate = (title, content, actionLink = null, actionText = null) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
    /* Reset & Basics */
    body { margin: 0; padding: 0; background-color: #000000; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #cccccc; }
    table { border-spacing: 0; width: 100%; }
    td { padding: 0; }
    img { border: 0; }
    
    /* Layout */
    .wrapper { width: 100%; table-layout: fixed; background-color: #000000; padding-bottom: 40px; }
    .main-table { background-color: #000000; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; color: #cccccc; box-shadow: 0 10px 25px rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden; border: 1px solid #333333; }
    
    /* Header */
    .header { background-color: #111111; padding: 40px 20px; text-align: center; background-image: linear-gradient(135deg, #111 0%, #222 100%); }
    .logo-text { color: #d4af37; font-size: 28px; font-weight: 700; letter-spacing: 3px; text-decoration: none; text-transform: uppercase; font-family: 'Playfair Display', serif, Georgia; }
    .logo-sub { color: #888; font-size: 10px; letter-spacing: 4px; text-transform: uppercase; margin-top: 5px; display: block; }

    /* Content */
    .content-cell { padding: 40px 40px; }
    .h1 { font-size: 24px; font-weight: 600; color: #ffffff; margin: 0 0 20px 0; letter-spacing: -0.5px; }
    .p { font-size: 16px; line-height: 1.6; color: #aaaaaa; margin: 0 0 20px 0; }
    
    /* Box/Card */
    .info-box { background-color: #111111; border: 1px solid #333333; border-radius: 6px; padding: 25px; margin: 30px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #444444; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #888888; font-size: 14px; }
    .info-value { font-weight: 500; color: #ffffff; font-size: 14px; text-align: right; }

    /* Button */
    .btn-container { text-align: center; margin: 35px 0; }
    .btn { background-color: #d4af37; color: #ffffff !important; padding: 14px 30px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4); text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s ease; }
    .btn:hover { background-color: #bfa13d; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5); }

    /* Footer */
    .footer { background-color: #111111; padding: 30px 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #333; }
    .footer-links a { color: #d4af37; text-decoration: none; margin: 0 8px; font-weight: 600; }
    .social-links { margin-bottom: 15px; }
    .social-links img { height: 20px; margin: 0 5px; opacity: 0.6; }
    
    /* Utilities */
    .highlight { color: #d4af37; font-weight: bold; }
    .text-center { text-align: center; }
    
    @media only screen and (max-width: 600px) {
        .content-cell { padding: 30px 20px; }
        .h1 { font-size: 22px; }
        .btn { width: 80%; display: block; margin: 0 auto; box-sizing: border-box; }
    }
</style>
</head>
<body>
    <div class="wrapper">
        <table class="main-table" align="center">
            <!-- Header -->
            <tr>
                <td class="header">
                    <a href="${process.env.CLIENT_URL || '#'}" class="logo-text" style="color: #d4af37;">LUXURYSTAY</a>
                    <span class="logo-sub">Hotel & Resort</span>
                </td>
            </tr>
            
            <!-- Content -->
            <tr>
                <td class="content-cell">
                    <h1 class="h1">${title}</h1>
                    <div class="p">${content}</div>
                    
                    ${actionLink ? `
                    <div class="btn-container">
                        <a href="${actionLink}" class="btn">${actionText}</a>
                    </div>
                    ` : ''}

                    <p class="p" style="margin-top: 40px; font-size: 14px; border-top: 1px solid #333; padding-top: 20px;">
                        Warm Regards,<br>
                        <strong style="color: #ffffff;">The LuxuryStay Team</strong>
                    </p>
                </td>
            </tr>
            
            <!-- Footer -->
            <tr>
                <td class="footer">
                    <div class="footer-links">
                        <a href="${process.env.CLIENT_URL}/contact">Contact Support</a>
                        <a href="${process.env.CLIENT_URL}/privacy">Privacy Policy</a>
                        <a href="${process.env.CLIENT_URL}/terms">Terms of Service</a>
                    </div>
                    <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} LuxuryStay Hotel. All rights reserved.</p>
                    <p>123 Luxury Ave, Paradise City, PC 56789</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
  `;
};

export const bookingConfirmationTemplate = (booking, room) => {
    const details = `
    <div class="info-box">
        <div class="info-row"><span class="info-label">Confirmation ID</span><span class="info-value">#${booking._id.toString().slice(-8).toUpperCase()}</span></div>
        <div class="info-row"><span class="info-label">Room Type</span><span class="info-value">${room.type}</span></div>
        <div class="info-row"><span class="info-label">Room Number</span><span class="info-value">${room.roomNumber}</span></div>
        <div class="info-row"><span class="info-label">Check-in</span><span class="info-value">${new Date(booking.checkInDate).toLocaleDateString()}</span></div>
        <div class="info-row"><span class="info-label">Check-out</span><span class="info-value">${new Date(booking.checkOutDate).toLocaleDateString()}</span></div>
        <div class="info-row"><span class="info-label">Guests</span><span class="info-value">${booking.guests}</span></div>
        <div class="info-row" style="border-bottom: none;"><span class="info-label" style="color:#d4af37;">Total Paid</span><span class="info-value" style="font-size: 18px; color:#d4af37;">$${booking.totalAmount}</span></div>
    </div>
    `;

    return getEmailTemplate(
        "Booking Confirmed",
        `Dear Guest,<br><br>We are thrilled to confirm your stay at <strong>LuxuryStay</strong>. We have received your payment and your room is reserved.<br>${details}<br>We look forward to providing you with an exceptional experience.`,
        `${process.env.CLIENT_URL}/my-bookings`,
        "Manage My Booking"
    );
};

export const bookingCancellationTemplate = (booking, room) => {
    return getEmailTemplate(
        "Booking Cancelled",
        `Dear Guest,<br><br>This email confirms that your booking for <strong>${room.type}</strong> has been cancelled as requested.<br><br>
        <div class="info-box" style="text-align: center; color: #ff6b6b; background-color: #2a0000; border-color: #661111;">
            <span style="font-weight: bold;">Status: Cancelled</span><br>
            <span style="font-size: 13px;">Transaction Refunded (if applicable)</span>
        </div>
        We hope to have the opportunity to welcome you back in the future.`
    );
};

export const inquiryReceivedTemplate = (name) => {
    return getEmailTemplate(
        "We Received Your Message",
        `Dear ${name},<br><br>Thank you for reaching out to <strong>LuxuryStay</strong>. We have received your message and our team is reviewing it.<br><br>You can expect a response within 24 hours. In the meantime, we invite you to explore our latest offerings on our website.`,
        `${process.env.CLIENT_URL}/rooms`,
        "Explore Rooms"
    );
};

export const inquiryReplyTemplate = (name, originalMessage, replyMessage) => {
    return getEmailTemplate(
        "Response from LuxuryStay",
        `Dear ${name},<br><br>${replyMessage}<br><br>
        <div style="background-color: #111111; padding: 15px; border-left: 3px solid #666; font-style: italic; color: #aaaaaa; font-size: 13px; margin-top: 20px;">
            <strong>Your Message:</strong><br>${originalMessage}
        </div>`,
        `${process.env.CLIENT_URL}/contact`,
        "Reply"
    );
};

export const eventInquiryReceivedTemplate = (event) => {
    const details = `
    <div class="info-box">
        <div class="info-row"><span class="info-label">Event Type</span><span class="info-value">${event.eventType}</span></div>
        <div class="info-row"><span class="info-label">Requested Date</span><span class="info-value">${new Date(event.date).toLocaleDateString()}</span></div>
        <div class="info-row"><span class="info-label">Guests</span><span class="info-value">${event.guests}</span></div>
    </div>
    `;
    return getEmailTemplate(
        "Event Inquiry Received",
        `Dear ${event.contactInfo.name},<br><br>Thank you for considering <strong>LuxuryStay</strong> for your upcoming event. We have successfully received your inquiry.<br>${details}<br>Our Event Coordinator will review your requirements and contact you shortly to discuss the details.`
    );
};

export const eventStatusUpdateTemplate = (event, status) => {
    let headerText = "";
    let messageBody = "";
    let color = "#cccccc";
    let bgColor = "#111111";
    let borderColor = "#333333";

    if (status === 'Confirmed') {
        headerText = "Event Confirmed";
        messageBody = `We are delighted to inform you that your <strong>${event.eventType}</strong> has been <span style="color: #48bb78; font-weight: bold;">APPROVED</span>. We are ready to make your event unforgettable.`;
        color = "#48bb78";
        bgColor = "#002200";
        borderColor = "#004400";
    } else if (status === 'Cancelled' || status === 'Rejected' || status === 'Decline') {
        headerText = "Event Update";
        messageBody = `We regret to inform you that we are unable to proceed with your <strong>${event.eventType}</strong> request at this time. The status is now: <span style="color: #f56565; font-weight: bold;">${status.toUpperCase()}</span>.`;
        color = "#f56565";
        bgColor = "#2a0000";
        borderColor = "#661111";
    } else {
        headerText = "Event Status Update";
        messageBody = `The status of your event has been updated to: <strong>${status}</strong>.`;
    }

    const statusBox = `
    <div class="info-box" style="background-color: ${bgColor}; border-color: ${borderColor}; text-align: center;">
        <span style="color: ${color}; font-weight: bold; font-size: 18px;">${status.toUpperCase()}</span>
    </div>
    `;

    return getEmailTemplate(
        headerText,
        `Dear ${event.contactInfo.name},<br><br>${messageBody}<br>${statusBox}<br>If you need further assistance, please contact our events team.`
    );
};
