import os
import io
import base64
import logging
import qrcode
import resend

resend.api_key = os.getenv("RESEND_API_KEY")

# Fix — proper logging instead of print statements
logger = logging.getLogger(__name__)


def generate_qr_png_base64(qr_token: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=2
    )

    qr.add_data(qr_token)
    qr.make(fit=True)

    img = qr.make_image()

    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")

    return base64.b64encode(
        img_bytes.getvalue()
    ).decode("utf-8")


async def send_registration_email(
    email: str,
    name: str,
    event_name: str,
    qr_token: str
):
    try:
        logger.info(f"Generating QR code for delegate: {email}")

        qr_image = generate_qr_png_base64(qr_token)  # untouched

        html_body = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Registration Confirmation — {event_name}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f6f9; font-family: 'Segoe UI', Arial, sans-serif;">

            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9; padding: 40px 0;">
                <tr>
                    <td align="center">

                        <!-- Card -->
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #6d28d9, #4f46e5); padding: 36px 40px; text-align:center;">
                                    <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:0.5px;">
                                        EventSphere
                                    </h1>
                                    <p style="margin:6px 0 0; color:#c4b5fd; font-size:13px; letter-spacing:1px; text-transform:uppercase;">
                                        Delegate Registration Portal
                                    </p>
                                </td>
                            </tr>

                            <!-- Success Badge -->
                            <tr>
                                <td align="center" style="padding: 32px 40px 0;">
                                    <div style="display:inline-block; background-color:#ecfdf5; border:1px solid #6ee7b7; border-radius:999px; padding:8px 20px;">
                                        <span style="color:#065f46; font-size:13px; font-weight:600; letter-spacing:0.5px;">
                                             &nbsp;REGISTRATION CONFIRMED
                                        </span>
                                    </div>
                                </td>
                            </tr>

                            <!-- Greeting -->
                            <tr>
                                <td style="padding: 28px 40px 0;">
                                    <h2 style="margin:0; color:#1e1b4b; font-size:22px; font-weight:600;">
                                        Hello, {name}
                                    </h2>
                                    <p style="margin:12px 0 0; color:#4b5563; font-size:15px; line-height:1.7;">
                                        Your registration for the following event has been successfully confirmed.
                                        Please find your official delegate QR pass attached to this email.
                                    </p>
                                </td>
                            </tr>

                            <!-- Event Info Box -->
                            <tr>
                                <td style="padding: 24px 40px 0;">
                                    <table width="100%" cellpadding="0" cellspacing="0"
                                        style="background-color:#f5f3ff; border-left:4px solid #7c3aed; border-radius:6px; padding:0;">
                                        <tr>
                                            <td style="padding:20px 24px;">
                                                <p style="margin:0 0 6px; font-size:11px; font-weight:600; color:#7c3aed; text-transform:uppercase; letter-spacing:1px;">
                                                    Event Details
                                                </p>
                                                <p style="margin:0; font-size:18px; font-weight:700; color:#1e1b4b;">
                                                    {event_name}
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- QR Instructions -->
                            <tr>
                                <td style="padding: 24px 40px 0;">
                                    <table width="100%" cellpadding="0" cellspacing="0"
                                        style="background-color:#fafafa; border:1px solid #e5e7eb; border-radius:8px;">
                                        <tr>
                                            <td style="padding:20px 24px;">
                                                <p style="margin:0 0 12px; font-size:14px; font-weight:700; color:#111827;">
                                                    📎 &nbsp;Your QR Pass — Instructions
                                                </p>
                                                <ul style="margin:0; padding-left:18px; color:#4b5563; font-size:14px; line-height:2;">
                                                    <li>Your unique QR pass is attached as <strong>EventSphere_QR_Pass.png</strong></li>
                                                    <li>Present this pass at the event entrance for seamless check-in</li>
                                                    <li>The pass is also required for meal distribution and accommodation check-in</li>
                                                    <li>Screenshot or print it for offline access</li>
                                                    <li>Do <strong>not</strong> share this pass — it is unique to your registration</li>
                                                </ul>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Support Note -->
                            <tr>
                                <td style="padding: 24px 40px 0;">
                                    <p style="margin:0; font-size:13px; color:#6b7280; line-height:1.7;">
                                        If you did not register for this event or believe this email was sent in error,
                                        please disregard this message or contact the event organizer immediately.
                                    </p>
                                </td>
                            </tr>

                            <!-- Divider -->
                            <tr>
                                <td style="padding: 28px 40px 0;">
                                    <hr style="border:none; border-top:1px solid #e5e7eb; margin:0;" />
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 24px 40px 32px; text-align:center;">
                                    <p style="margin:0 0 4px; font-size:13px; font-weight:600; color:#4b5563;">
                                        EventSphere Team
                                    </p>
                                    <p style="margin:0; font-size:12px; color:#9ca3af;">
                                        This is an automated message. Please do not reply to this email.
                                    </p>
                                </td>
                            </tr>

                        </table>
                        <!-- End Card -->

                    </td>
                </tr>
            </table>

        </body>
        </html>
        """

        params = {
            "from": os.getenv("EMAIL_FROM"),  # untouched
            "to": [email],                     # untouched
            "subject": f"Registration Confirmed — {event_name} | EventSphere",
            "html": html_body,
            "attachments": [
                {
                    "filename": "EventSphere_QR_Pass.png",
                    "content": qr_image        # untouched
                }
            ]
        }

        logger.info(f"Dispatching registration confirmation to: {email}")

        last_error = None

        for attempt in range(1, 4):

            try:

                response = resend.Emails.send(params)

                logger.info(
                    f"Email delivered successfully. Resend response ID: {response.get('id', 'N/A')}"
                )

                return True

            except Exception as e:

                last_error = e

                logger.warning(
                    f"Attempt {attempt}/3 failed for {email}: {str(e)}"
                )

                if attempt < 3:

                    import time

                    time.sleep(2 * attempt)

        logger.error(
            f"All retry attempts failed for {email}: {last_error}"
        )

        return False

    except Exception as e:

        logger.error(
            f"Failed to dispatch registration email to {email}: {str(e)}"
        )

        return False