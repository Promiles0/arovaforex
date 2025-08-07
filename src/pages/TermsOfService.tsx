import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Terms of Service</CardTitle>
            <p className="text-muted-foreground text-center">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none dark:prose-invert">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using our trading platform, you accept and agree to be bound by 
                  the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
                <p className="text-muted-foreground mb-4">
                  Our platform provides trading signals, market forecasts, and educational content. 
                  These services are for informational purposes only.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Trading signals and market analysis</li>
                  <li>Educational resources and academy content</li>
                  <li>Portfolio tracking and management tools</li>
                  <li>Community features and support</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Risk Disclosure</h2>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-destructive mb-2">Important Risk Warning:</p>
                  <p className="text-muted-foreground">
                    Trading involves substantial risk of loss and is not suitable for all investors. 
                    Past performance does not guarantee future results.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>All trading signals are for educational purposes only</li>
                  <li>We do not guarantee profits or success</li>
                  <li>You are responsible for your own trading decisions</li>
                  <li>Never invest more than you can afford to lose</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
                <p className="text-muted-foreground mb-4">As a user of our platform, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account</li>
                  <li>Use the platform in compliance with applicable laws</li>
                  <li>Respect other users and our community guidelines</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Prohibited Activities</h2>
                <p className="text-muted-foreground mb-4">You may not:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Share your account credentials with others</li>
                  <li>Attempt to reverse engineer our platform</li>
                  <li>Use automated tools to access our services</li>
                  <li>Distribute harmful or malicious content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  We shall not be liable for any direct, indirect, incidental, special, 
                  consequential, or exemplary damages resulting from your use of our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
                <p className="text-muted-foreground">
                  We reserve the right to terminate or suspend your account at our sole discretion, 
                  without notice, for conduct that we believe violates these Terms of Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact us at legal@tradingplatform.com
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;