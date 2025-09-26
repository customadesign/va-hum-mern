const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Billing = require('../models/Billing');
const Trial = require('../models/Trial');
const User = require('../models/User');
const { sendEmail } = require('../utils/email');

// @desc    Handle Stripe webhook events
// @route   POST /api/billing/webhook
// @access  Public (Stripe webhook)
exports.handleStripeWebhook = async (req, res) => {
  const event = req.stripeEvent; // Attached by validateStripeWebhook middleware

  try {
    // Handle the event based on type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;
        
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(400).json({ error: 'Webhook handler failed' });
  }
};

// Handle successful payment
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const { metadata, amount, currency, id, charges } = paymentIntent;
    
    if (!metadata.businessId) {
      console.error('No businessId in payment metadata');
      return;
    }

    // Find billing record
    const billing = await Billing.findOne({ 
      business: metadata.businessId 
    }).populate('business');

    if (!billing) {
      console.error('Billing record not found for business:', metadata.businessId);
      return;
    }

    // Update payment record if not already recorded
    const existingPayment = billing.payments.find(
      p => p.stripePaymentIntentId === id
    );

    if (!existingPayment) {
      await billing.addPayment({
        stripePaymentIntentId: id,
        amount: amount / 100, // Convert from cents
        currency,
        status: 'succeeded',
        description: paymentIntent.description || 'Payment',
        receiptUrl: charges.data[0]?.receipt_url
      });
    }

    // If this is a trial purchase, ensure trial is activated
    if (metadata.type === 'trial_purchase') {
      const trial = await Trial.findOne({
        paymentIntentId: id
      });

      if (trial && trial.status !== 'active') {
        trial.status = 'active';
        await trial.save();
      }

      // Send confirmation email
      const business = await billing.business;
      const user = await User.findOne({ business: business._id });
      
      if (user && user.email) {
        await sendTrialPurchaseConfirmation(user.email, {
          businessName: business.company,
          receiptUrl: charges.data[0]?.receipt_url
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent) {
  try {
    const { metadata, id, last_payment_error } = paymentIntent;
    
    if (!metadata.businessId) {
      return;
    }

    // Find billing record
    const billing = await Billing.findOne({ 
      business: metadata.businessId 
    }).populate('business');

    if (!billing) {
      return;
    }

    // Record failed payment
    await billing.addPayment({
      stripePaymentIntentId: id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'failed',
      description: `Failed: ${last_payment_error?.message || 'Unknown error'}`
    });

    // Send notification email
    const business = await billing.business;
    const user = await User.findOne({ business: business._id });
    
    if (user && user.email && billing.notifications.paymentFailed) {
      await sendPaymentFailedNotification(user.email, {
        businessName: business.company,
        errorMessage: last_payment_error?.message || 'Payment failed'
      });
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Handle successful setup intent (card saved)
async function handleSetupIntentSucceeded(setupIntent) {
  try {
    const { metadata, payment_method } = setupIntent;
    
    if (!metadata.businessId) {
      return;
    }

    console.log(`Card successfully saved for business: ${metadata.businessId}`);
    
    // Optionally send confirmation email
    const billing = await Billing.findOne({ 
      business: metadata.businessId 
    }).populate('business');

    if (billing) {
      const business = await billing.business;
      const user = await User.findOne({ business: business._id });
      
      if (user && user.email) {
        await sendCardSavedConfirmation(user.email, {
          businessName: business.company
        });
      }
    }
  } catch (error) {
    console.error('Error handling setup intent success:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  try {
    const customerId = subscription.customer;
    
    // Find billing by Stripe customer ID
    const billing = await Billing.findOne({ 
      stripeCustomerId: customerId 
    });

    if (!billing) {
      return;
    }

    // Mark any active trials as cancelled
    await Trial.updateMany(
      { 
        billing: billing._id,
        status: 'active'
      },
      { 
        status: 'cancelled',
        cancelledAt: new Date()
      }
    );

    console.log(`Subscription cancelled for customer: ${customerId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Handle payment method attached
async function handlePaymentMethodAttached(paymentMethod) {
  try {
    const customerId = paymentMethod.customer;
    
    // Find billing by Stripe customer ID
    const billing = await Billing.findOne({ 
      stripeCustomerId: customerId 
    });

    if (!billing) {
      return;
    }

    console.log(`Payment method attached for customer: ${customerId}`);
  } catch (error) {
    console.error('Error handling payment method attachment:', error);
  }
}

// Handle payment method detached
async function handlePaymentMethodDetached(paymentMethod) {
  try {
    const { id } = paymentMethod;
    
    // Find and remove from all billing records
    await Billing.updateMany(
      { 'paymentMethods.stripePaymentMethodId': id },
      { 
        $pull: { 
          paymentMethods: { 
            stripePaymentMethodId: id 
          } 
        } 
      }
    );

    console.log(`Payment method detached: ${id}`);
  } catch (error) {
    console.error('Error handling payment method detachment:', error);
  }
}

// Email helper functions
async function sendTrialPurchaseConfirmation(email, data) {
  const subject = '10-Hour Trial Package Activated';
  const html = `
    <h2>Welcome to Your VA Trial!</h2>
    <p>Dear ${data.businessName},</p>
    <p>Your 10-hour VA trial package has been successfully activated.</p>
    <h3>What's Included:</h3>
    <ul>
      <li>10 hours of professional VA services</li>
      <li>Access to our vetted VA network</li>
      <li>Real-time hour tracking</li>
      <li>30-day validity period</li>
    </ul>
    <p>You can start using your trial hours immediately by connecting with a VA through our platform.</p>
    ${data.receiptUrl ? `<p><a href="${data.receiptUrl}">View Receipt</a></p>` : ''}
    <p>Best regards,<br>The Linkage VA Hub Team</p>
  `;

  try {
    await sendEmail({
      to: email,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending trial confirmation email:', error);
  }
}

async function sendPaymentFailedNotification(email, data) {
  const subject = 'Payment Failed - Action Required';
  const html = `
    <h2>Payment Failed</h2>
    <p>Dear ${data.businessName},</p>
    <p>We were unable to process your recent payment.</p>
    <p><strong>Error:</strong> ${data.errorMessage}</p>
    <p>Please update your payment method or try again with a different card.</p>
    <p>If you continue to experience issues, please contact our support team.</p>
    <p>Best regards,<br>The Linkage VA Hub Team</p>
  `;

  try {
    await sendEmail({
      to: email,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending payment failed email:', error);
  }
}

async function sendCardSavedConfirmation(email, data) {
  const subject = 'Payment Method Successfully Added';
  const html = `
    <h2>Payment Method Added</h2>
    <p>Dear ${data.businessName},</p>
    <p>Your payment method has been successfully added to your account.</p>
    <p>You can now purchase VA service packages and manage your billing through the platform.</p>
    <p>Best regards,<br>The Linkage VA Hub Team</p>
  `;

  try {
    await sendEmail({
      to: email,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending card saved email:', error);
  }
}