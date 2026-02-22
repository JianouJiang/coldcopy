#!/usr/bin/env python3
"""
Create LIVE Stripe Payment Links for ColdCopy with CORRECT pricing:
- Monthly: $19/month recurring
- Lifetime: $49 one-time

This replaces the old incorrect pricing structure.
"""

import stripe
import os
from dotenv import load_dotenv

# Load LIVE keys from .env
load_dotenv('/home/jianoujiang/Desktop/proxima-auto-company/.env')
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

PRODUCTION_URL = "https://coldcopy-au3.pages.dev"

def create_payment_links():
    """Create Stripe products, prices, and payment links with CORRECT pricing"""

    print("Creating ColdCopy LIVE payment infrastructure...\n")
    print("=" * 60)

    # ========== MONTHLY TIER ($19/month recurring) ==========
    print("\n📅 MONTHLY PLAN: $19/month")
    print("-" * 60)

    print("1. Creating product...")
    monthly_product = stripe.Product.create(
        name="ColdCopy Monthly",
        description="Unlimited AI-generated cold email sequences - Monthly subscription",
        metadata={
            "tier": "monthly",
            "quota": "unlimited",
            "product": "coldcopy"
        }
    )
    print(f"   ✓ Product ID: {monthly_product.id}")

    print("2. Creating price ($19/month)...")
    monthly_price = stripe.Price.create(
        product=monthly_product.id,
        unit_amount=1900,  # $19.00 USD
        currency="usd",
        recurring={
            "interval": "month"
        },
        metadata={
            "tier": "monthly"
        }
    )
    print(f"   ✓ Price ID: {monthly_price.id}")

    print("3. Creating Payment Link...")
    monthly_link = stripe.PaymentLink.create(
        line_items=[{
            "price": monthly_price.id,
            "quantity": 1
        }],
        after_completion={
            "type": "redirect",
            "redirect": {
                "url": f"{PRODUCTION_URL}/success?session_id={{CHECKOUT_SESSION_ID}}"
            }
        },
        metadata={
            "tier": "monthly",
            "quota": "unlimited"
        }
    )
    print(f"   ✓ Payment Link: {monthly_link.url}")

    # ========== LIFETIME TIER ($49 one-time) ==========
    print("\n💎 LIFETIME PLAN: $49 one-time")
    print("-" * 60)

    print("1. Creating product...")
    lifetime_product = stripe.Product.create(
        name="ColdCopy Lifetime",
        description="Unlimited AI-generated cold email sequences - Lifetime access",
        metadata={
            "tier": "lifetime",
            "quota": "unlimited",
            "product": "coldcopy"
        }
    )
    print(f"   ✓ Product ID: {lifetime_product.id}")

    print("2. Creating price ($49 one-time)...")
    lifetime_price = stripe.Price.create(
        product=lifetime_product.id,
        unit_amount=4900,  # $49.00 USD
        currency="usd",
        metadata={
            "tier": "lifetime"
        }
    )
    print(f"   ✓ Price ID: {lifetime_price.id}")

    print("3. Creating Payment Link...")
    lifetime_link = stripe.PaymentLink.create(
        line_items=[{
            "price": lifetime_price.id,
            "quantity": 1
        }],
        after_completion={
            "type": "redirect",
            "redirect": {
                "url": f"{PRODUCTION_URL}/success?session_id={{CHECKOUT_SESSION_ID}}"
            }
        },
        metadata={
            "tier": "lifetime",
            "quota": "unlimited"
        }
    )
    print(f"   ✓ Payment Link: {lifetime_link.url}")

    # ========== SUMMARY ==========
    print("\n" + "=" * 60)
    print("✅ STRIPE PAYMENT LINKS CREATED SUCCESSFULLY")
    print("=" * 60)

    print("\n📅 MONTHLY ($19/month recurring):")
    print(f"   Product ID:  {monthly_product.id}")
    print(f"   Price ID:    {monthly_price.id}")
    print(f"   Link:        {monthly_link.url}")

    print("\n💎 LIFETIME ($49 one-time):")
    print(f"   Product ID:  {lifetime_product.id}")
    print(f"   Price ID:    {lifetime_price.id}")
    print(f"   Link:        {lifetime_link.url}")

    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("1. Copy payment links to Paywall.tsx")
    print("2. Update pricing display ($19/month and $49 lifetime)")
    print("3. Remove CLOSE button from paywall modal")
    print("4. Add localStorage clear on success page")
    print("5. Deploy to production")
    print("=" * 60)

    return {
        "monthly": {
            "product_id": monthly_product.id,
            "price_id": monthly_price.id,
            "payment_link": monthly_link.url,
        },
        "lifetime": {
            "product_id": lifetime_product.id,
            "price_id": lifetime_price.id,
            "payment_link": lifetime_link.url,
        }
    }

if __name__ == "__main__":
    try:
        data = create_payment_links()

        # Write to file for reference
        with open('PAYMENT_LINKS_LIVE.txt', 'w') as f:
            f.write("COLDCOPY LIVE PAYMENT LINKS\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"MONTHLY_LINK={data['monthly']['payment_link']}\n")
            f.write(f"LIFETIME_LINK={data['lifetime']['payment_link']}\n\n")
            f.write(f"MONTHLY_PRODUCT_ID={data['monthly']['product_id']}\n")
            f.write(f"MONTHLY_PRICE_ID={data['monthly']['price_id']}\n\n")
            f.write(f"LIFETIME_PRODUCT_ID={data['lifetime']['product_id']}\n")
            f.write(f"LIFETIME_PRICE_ID={data['lifetime']['price_id']}\n")

        print("\n✅ Payment links saved to PAYMENT_LINKS_LIVE.txt")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure you're using LIVE Stripe API keys (sk_live_*)")
        exit(1)
