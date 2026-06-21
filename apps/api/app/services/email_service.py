import os
import io
import base64
import qrcode
import resend

resend.api_key = os.getenv("RESEND_API_KEY")


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
        print("Generating QR...")

        qr_image = generate_qr_png_base64(qr_token)

        params = {
            "from": os.getenv("EMAIL_FROM"),
            "to": [email],
            "subject": f"Registration Confirmed - {event_name}",
            "html": f"""
            <h2>Hello {name},</h2>

            <p>Your registration has been confirmed.</p>

            <p><strong>Event:</strong> {event_name}</p>

            <p>Your QR Pass is attached to this email.</p>

            <p>Please keep it safe and show it during entry.</p>

            <br>

            <p>Regards,</p>
            <p>EventSphere Team</p>
            """,
            "attachments": [
                {
                    "filename": "EventSphere_QR_Pass.png",
                    "content": qr_image
                }
            ]
        }

        print("Sending email...")

        response = resend.Emails.send(params)

        print("RESEND RESPONSE:")
        print(response)

        return True

    except Exception as e:
        print("EMAIL ERROR:")
        print(str(e))
        return False