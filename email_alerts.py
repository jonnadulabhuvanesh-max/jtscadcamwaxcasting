import os
import smtplib
from email.message import EmailMessage
from supabase import create_client, Client

# --- 1. Supabase Credentials (Secured) ---
SUPABASE_URL = "https://qigttukglcpeewxibqcf.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY")
if not SUPABASE_KEY:
    print("FATAL ERROR: SUPABASE_SECRET_KEY environment variable is missing!")
    exit()
    
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 2. Gmail Credentials (Secured) ---
EMAIL_ADDRESS = "jtscadcamwaxcasting@gmail.com"
EMAIL_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")

if not EMAIL_PASSWORD:
    print("FATAL ERROR: GMAIL_APP_PASSWORD environment variable is missing!")
    exit()

def send_email_alert(client_name, client_phone, category, description):
    msg = EmailMessage()
    # Phone number is now included in the email body
    msg.set_content(f"New Custom CAD Order Received!\n\nClient: {client_name}\nPhone: {client_phone}\nCategory: {category}\nDetails: {description}")
    
    msg['Subject'] = f"🚨 Action Required: New Custom CAD Request from {client_name}"
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = EMAIL_ADDRESS

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            smtp.send_message(msg)
            print(f"Alert successfully sent for {client_name}!")
    except Exception as e:
        print(f"Failed to send email: {e}")

def check_for_new_orders():
    print("Checking Supabase for new customer requests...")
    try:
        response = supabase.table('custom_requests').select('*').eq('status', 'Pending').execute()
        
        for order in response.data:
            # Grabs the phone number, or defaults to a message if empty
            phone_num = order.get('phone', 'No phone provided')
            send_email_alert(order['name'], phone_num, order['category'], order['description'])
            
            # Update status to prevent duplicate emails
            supabase.table('custom_requests').update({'status': 'Alert Sent'}).eq('id', order['id']).execute()
            
    except Exception as e:
        print(f"Database error: {e}")

def check_for_bad_reviews():
    print("Checking Supabase for low star reviews (<= 3 stars)...")
    try:
        response = supabase.table('reviews').select('*').lte('stars', 3).eq('alert_sent', False).execute()
        
        for review in response.data:
            review_id = review['id']
            client_name = review.get('name', 'Anonymous')
            client_place = review.get('place', 'No place provided')
            stars = review.get('stars', 0)
            description = review.get('description', 'No description provided.')

            msg = EmailMessage()
            msg.set_content(
                f"⚠️ Low Customer Rating / Review Alert!\n\n"
                f"Client Name: {client_name}\n"
                f"Location / Place: {client_place}\n"
                f"Rating: {stars} / 5 Stars\n"
                f"Review Description:\n{description}\n"
            )
            msg['Subject'] = f"⚠️ Low Review Alert ({stars}★): {client_name}"
            msg['From'] = EMAIL_ADDRESS
            msg['To'] = "jtscadcamwaxcasting@gmail.com"

            try:
                with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
                    smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
                    smtp.send_message(msg)
                    print(f"Alert successfully sent for review by {client_name} ({stars} stars)!")
                
                # Update alert_sent to True to prevent duplicate emails
                supabase.table('reviews').update({'alert_sent': True}).eq('id', review_id).execute()
            except Exception as mail_err:
                print(f"Failed to send email for review ID {review_id}: {mail_err}")

    except Exception as e:
        print(f"Database error while checking reviews: {e}")

# --- 3. Serverless Execution Logic ---
if __name__ == "__main__":
    print("GitHub Actions Worker Triggered. Checking for new orders and reviews...")
    check_for_new_orders()
    check_for_bad_reviews()
    print("Worker task complete. Shutting down.")