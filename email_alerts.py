import os
import smtplib
from email.message import EmailMessage
from supabase import create_client, Client

# --- 1. Supabase Credentials (Secured) ---
SUPABASE_URL = "https://qigttukglcpeewxibqcf.supabase.co"
SUPABASE_KEY = os.environ.get("sb_secret_IvxXs8VWv3FS3prz-cpM1Q_KdUYwqCS") 

if not SUPABASE_KEY:
    print("FATAL ERROR: SUPABASE_SECRET_KEY environment variable is missing!")
    exit()
    
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 2. Gmail Credentials (Secured) ---
EMAIL_ADDRESS = "jtscadcamwaxcasting@gmail.com"
EMAIL_PASSWORD = os.environ.get("bskydwyopjjnsvvt") 

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

# --- 3. Serverless Execution Logic ---
if __name__ == "__main__":
    print("GitHub Actions Worker Triggered. Checking for new orders...")
    check_for_new_orders()
    print("Worker task complete. Shutting down.")