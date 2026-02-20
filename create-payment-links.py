#!/usr/bin/env python3
"""
Create Stripe Payment Links for ColdCopy
Generates both Starter (one-time) and Pro (subscription) tiers
"""

import stripe
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/home/jianoujiang/Desktop/proxima-auto-company/.env')

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

def create_payment_links():
    """Create Stripe products, prices, and payment links"""

    print("Creating ColdCopy payment infrastructure...\n")

    # ========== STARTER TIER (One-time) ==========
    print("1. Creating ColdCopy Starter product...")
    starter_product = stripe.Product.create(
        name="ColdCopy Starter",
        description="50 AI-generated cold email sequences for B2B SaaS",
        metadata={
            "tier": "starter",
            "quota": "50",
            "product": "coldcopy"
        }
    )
    print(f"   ✓ Product created: {starter_product.id}")

    print("2. Creating Starter price ($19 USD)...")
    starter_price = stripe.Price.create(
        product=starter_product.id,
        unit_amount=1900,  # $19.00 in cents
        currency="usd",
        metadata={
            "tier": "starter"
        }
    )
    print(f"   ✓ Price created: {starter_price.id}")

    print("3. Creating Starter Payment Link...")
    starter_link = stripe.PaymentLink.create(
        line_items=[{
            "price": starter_price.id,
            "quantity": 1
        }],
        after_completion={
            "type": "redirect",
            "redirect": {
                "url": "https://jianoujiang.github.io/proxima-auto-company/projects/landing-page/?payment=success&tier=starter"
            }
        },
        metadata={
            "tier": "starter",
            "quota": "50"
        }
    )
    print(f"   ✓ Payment Link: {starter_link.url}\n")

    # ========== PRO TIER (Subscription) ==========
    print("4. Creating ColdCopy Pro product...")
    pro_product = stripe.Product.create(
        name="ColdCopy Pro",
        description="Unlimited AI-generated cold email sequences for B2B SaaS",
        metadata={
            "tier": "pro",
            "quota": "unlimited",
            "product": "coldcopy"
        }
    )
    print(f"   ✓ Product created: {pro_product.id}")

    print("5. Creating Pro price ($39/month USD)...")
    pro_price = stripe.Price.create(
        product=pro_product.id,
        unit_amount=3900,  # $39.00 in cents
        currency="usd",
        recurring={
            "interval": "month"
        },
        metadata={
            "tier": "pro"
        }
    )
    print(f"   ✓ Price created: {pro_price.id}")

    print("6. Creating Pro Payment Link...")
    pro_link = stripe.PaymentLink.create(
        line_items=[{
            "price": pro_price.id,
            "quantity": 1
        }],
        after_completion={
            "type": "redirect",
            "redirect": {
                "url": "https://jianoujiang.github.io/proxima-auto-company/projects/landing-page/?payment=success&tier=pro"
            }
        },
        metadata={
            "tier": "pro",
            "quota": "unlimited"
        }
    )
    print(f"   ✓ Payment Link: {pro_link.url}\n")

    # ========== SUMMARY ==========
    print("=" * 60)
    print("STRIPE PAYMENT LINKS CREATED SUCCESSFULLY")
    print("=" * 60)
    print("\n📦 ColdCopy Starter ($19 one-time):")
    print(f"   Product: {starter_product.id}")
    print(f"   Price:   {starter_price.id}")
    print(f"   Link:    {starter_link.url}")

    print("\n🚀 ColdCopy Pro ($39/month):")
    print(f"   Product: {pro_product.id}")
    print(f"   Price:   {pro_price.id}")
    print(f"   Link:    {pro_link.url}")

    print("\n✅ Next steps:")
    print("   1. Test payment links by visiting URLs above")
    print("   2. Embed links in ColdCopy UI")
    print("   3. Set up Stripe webhook for post-payment quota updates")
    print("=" * 60)

    # Return data for documentation
    return {
        "starter": {
            "product_id": starter_product.id,
            "price_id": starter_price.id,
            "payment_link": starter_link.url,
            "price": "$19 USD",
            "quota": "50 sequences"
        },
        "pro": {
            "product_id": pro_product.id,
            "price_id": pro_price.id,
            "payment_link": pro_link.url,
            "price": "$39/month USD",
            "quota": "Unlimited sequences"
        }
    }

if __name__ == "__main__":
    try:
        data = create_payment_links()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure STRIPE_SECRET_KEY is set in .env file")
        exit(1)
