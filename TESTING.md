# Testing the New Onboarding Flow

## To Test the Complete New User Flow:

1. **Open Developer Console** in your browser (or use Safari Web Inspector on iPhone)

2. **Run this command** to clear all app data and log out:
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

3. **The complete flow should now be:**
   - Landing Page → "Get Started"
   - What is InnerCode? → "Let's Begin"
   - Name Collection → Enter your name
   - Category Selection → Choose 3-5 areas
   - Onboarding Questions → Answer questions
   - Analyzing Screen → 10 second wait with quotes
   - **Sign Up Page** → Create your account
   - **Email Verification** → Verify your email
   - **Welcome Back Screen** → "Welcome, [Name]!"
   - **Reveal Results** → Click button to see results
   - Results Page → View your InnerCode profile
   - Dashboard → Full app access

## To Test as a Returning User:

If you're already logged in and have completed onboarding:
- Completing new questions → Goes directly to Welcome Back → Reveal Results

## If You're Stuck in Results After Analyzing:

This means you're already logged in! To test the signup flow:
1. Click the menu button (☰)
2. Click "Log Out"
3. Start the onboarding again from scratch
4. You should now see the Sign Up page after the analyzing screen

## Quick Reset for Testing:

Open browser console and run:
```javascript
// Complete reset - clears everything
localStorage.removeItem('innercode_results');
localStorage.removeItem('innercode_hasSeenResults');
localStorage.removeItem('innercode_state_v1');
localStorage.removeItem('innercode_userName');
localStorage.removeItem('innercode_selectedCategories');
window.location.href = '/';
```





