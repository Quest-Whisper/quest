"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Image
                src="/whisper_logo.png"
                alt="QuestWhisper Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-semibold text-gray-900">
                QuestWhisper
              </span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Last updated: 2nd July 2025
            </p>
          </motion.div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-50 rounded-lg p-6 mb-8"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <a href="#introduction" className="text-blue-600 hover:text-blue-800 transition-colors">1. Introduction</a>
              <a href="#information-collection" className="text-blue-600 hover:text-blue-800 transition-colors">2. Information We Collect</a>
              <a href="#data-usage" className="text-blue-600 hover:text-blue-800 transition-colors">3. How We Use Your Data</a>
              <a href="#data-storage" className="text-blue-600 hover:text-blue-800 transition-colors">4. Data Storage & Security</a>
              <a href="#third-party-services" className="text-blue-600 hover:text-blue-800 transition-colors">5. Third-Party Services</a>
              <a href="#google-integration" className="text-blue-600 hover:text-blue-800 transition-colors">6. Google Workspace Integration</a>
              <a href="#voice-data" className="text-blue-600 hover:text-blue-800 transition-colors">7. Voice & Audio Data</a>
              <a href="#shared-content" className="text-blue-600 hover:text-blue-800 transition-colors">8. Shared Content</a>
              <a href="#cookies" className="text-blue-600 hover:text-blue-800 transition-colors">9. Cookies & Tracking</a>
              <a href="#data-retention" className="text-blue-600 hover:text-blue-800 transition-colors">10. Data Retention</a>
              <a href="#user-rights" className="text-blue-600 hover:text-blue-800 transition-colors">11. Your Rights</a>
              <a href="#children-privacy" className="text-blue-600 hover:text-blue-800 transition-colors">12. Children's Privacy</a>
              <a href="#international-transfers" className="text-blue-600 hover:text-blue-800 transition-colors">13. International Data Transfers</a>
              <a href="#policy-changes" className="text-blue-600 hover:text-blue-800 transition-colors">14. Policy Changes</a>
              <a href="#contact" className="text-blue-600 hover:text-blue-800 transition-colors">15. Contact Information</a>
            </div>
          </motion.div>

          {/* Privacy Policy Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            {/* Section 1 */}
            <section id="introduction" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                At QuestWhisper, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, store, and protect your data when you use our AI-powered 
                conversational assistant service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using QuestWhisper, you agree to the collection and use of information in accordance with this policy. 
                We will not use or share your information with anyone except as described in this Privacy Policy.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Our Commitment:</strong> We prioritize your privacy and implement industry-standard security measures 
                  to protect your personal information and maintain your trust.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section id="information-collection" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">2. Information We Collect</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  When you use QuestWhisper, we collect the following personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Profile Information:</strong> Name, email address, profile picture (from your authentication provider)</li>
                  <li><strong>Account Data:</strong> User ID, authentication tokens, account preferences</li>
                  <li><strong>Communication Data:</strong> Chat messages, conversation history, AI interactions</li>
                  <li><strong>Usage Data:</strong> Feature usage patterns, session duration, interaction frequency</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Technical Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                  <li><strong>Connection Data:</strong> IP address, location data (general geographic region)</li>
                  <li><strong>Performance Data:</strong> Error logs, response times, system performance metrics</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Content You Share</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Shared Conversations:</strong> Content you choose to share publicly</li>
                  <li><strong>Feedback:</strong> User feedback, ratings, and support communications</li>
                  <li><strong>User-Generated Content:</strong> Any content you create or share through our platform</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section id="data-usage" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">3. How We Use Your Data</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Primary Uses</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use your information to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Provide Service:</strong> Deliver AI-powered conversational assistance and maintain chat history</li>
                  <li><strong>Personalization:</strong> Customize your experience and remember your preferences</li>
                  <li><strong>Authentication:</strong> Verify your identity and maintain secure access to your account</li>
                  <li><strong>Integration:</strong> Connect with your authorized third-party services (Google Workspace)</li>
                  <li><strong>Communication:</strong> Send service updates, respond to inquiries, and provide support</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Service Improvement</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Analytics:</strong> Analyze usage patterns to improve service quality and performance</li>
                  <li><strong>AI Training:</strong> Improve AI responses and accuracy (using anonymized data only)</li>
                  <li><strong>Bug Fixes:</strong> Identify and resolve technical issues and errors</li>
                  <li><strong>Feature Development:</strong> Develop new features based on user needs and feedback</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Legal Compliance</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Comply with applicable laws and regulations</li>
                  <li>Respond to legal requests and prevent fraud</li>
                  <li>Protect the rights and safety of our users and the public</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="data-storage" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">4. Data Storage & Security</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Security Measures</h3>
                <p className="text-gray-700 leading-relaxed">
                  We implement comprehensive security measures to protect your data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols</li>
                  <li><strong>Access Controls:</strong> Strict access controls and authentication mechanisms</li>
                  <li><strong>Regular Audits:</strong> Regular security audits and vulnerability assessments</li>
                  <li><strong>Secure Infrastructure:</strong> Use of secure cloud infrastructure with enterprise-grade security</li>
                  <li><strong>Monitoring:</strong> Continuous monitoring for unauthorized access and suspicious activities</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Data Storage Locations</h3>
                <p className="text-gray-700 leading-relaxed">
                  Your data is stored in secure data centers with the following characteristics:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Geographically distributed for redundancy and performance</li>
                  <li>Compliant with international data protection standards</li>
                  <li>Regular backups and disaster recovery procedures</li>
                  <li>Physical security measures and access controls</li>
                </ul>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    <strong>Security Commitment:</strong> We use bank-level encryption and security measures to protect your data. 
                    Your conversations and personal information are never accessible to unauthorized parties.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="third-party-services" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">5. Third-Party Services</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Authentication Providers</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use secure third-party authentication services to verify your identity:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Google OAuth:</strong> For Google account authentication and profile information</li>
                  <li><strong>Other OAuth Providers:</strong> Additional authentication options may be available</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">AI and ML Services</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our AI capabilities are powered by:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Large Language Models:</strong> Advanced AI models for natural language processing</li>
                  <li><strong>Speech Services:</strong> Voice-to-text and text-to-speech processing</li>
                  <li><strong>Search APIs:</strong> Web search and content extraction services</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Data Sharing Policies</h3>
                <p className="text-gray-700 leading-relaxed">
                  We only share data with third parties when:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Required to provide our services (e.g., authentication, AI processing)</li>
                  <li>You explicitly authorize the sharing</li>
                  <li>Required by law or legal process</li>
                  <li>Necessary to protect our rights or the safety of users</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="google-integration" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">6. Google Workspace Integration</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Access and Permissions</h3>
                <p className="text-gray-700 leading-relaxed">
                  When you authorize Google Workspace integration, we access:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Gmail:</strong> Read and send emails, search email content (only during active sessions)</li>
                  <li><strong>Google Drive:</strong> Access and search files, create documents (with your permission)</li>
                  <li><strong>Google Docs/Sheets/Slides:</strong> Create, read, and edit documents as requested</li>
                  <li><strong>Google Calendar:</strong> Read events and create calendar entries when requested</li>
                  <li><strong>Google Forms:</strong> Create forms and access responses as needed</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Data Handling</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Important:</strong> We do not store your Google Workspace data. All access is temporary and 
                    occurs only during your active session to fulfill your specific requests.
                  </p>
                </div>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>No Permanent Storage:</strong> Email content, files, and documents are not stored on our servers</li>
                  <li><strong>Session-Based Access:</strong> Data is accessed only when you make specific requests</li>
                  <li><strong>Minimal Processing:</strong> We process only the minimum data necessary to fulfill your request</li>
                  <li><strong>No Background Access:</strong> We do not access your Google data when you're not actively using the service</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Revoking Access</h3>
                <p className="text-gray-700 leading-relaxed">
                  You can revoke our access to your Google Workspace data at any time by:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Visiting your Google Account security settings</li>
                  <li>Removing QuestWhisper from your connected apps</li>
                  <li>Contacting our support team for assistance</li>
                </ul>
              </div>
            </section>

            {/* Section 7 */}
            <section id="voice-data" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">7. Voice & Audio Data</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Voice Input Processing</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our voice features work as follows:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Real-Time Processing:</strong> Voice input is processed in real-time and converted to text</li>
                  <li><strong>No Recording:</strong> We do not record, store, or save your voice input</li>
                  <li><strong>Immediate Deletion:</strong> Audio data is discarded immediately after processing</li>
                  <li><strong>Secure Transmission:</strong> All voice data is transmitted securely and encrypted</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Text-to-Speech Output</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Generated Audio:</strong> AI responses are converted to speech in real-time</li>
                  <li><strong>Streaming:</strong> Audio is streamed directly to your device without storage</li>
                  <li><strong>No Retention:</strong> Generated audio is not stored or retained</li>
                </ul>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    <strong>Privacy Guarantee:</strong> Your voice is never recorded, stored, or used for any purpose 
                    other than immediate conversion to text for your current conversation.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="shared-content" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">8. Shared Content</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Public Sharing</h3>
                <p className="text-gray-700 leading-relaxed">
                  When you choose to share AI conversations publicly:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Content Storage:</strong> The shared content is stored on our servers</li>
                  <li><strong>Public Access:</strong> Shared content becomes publicly accessible via unique URLs</li>
                  <li><strong>Attribution:</strong> Your name is associated with the shared content</li>
                  <li><strong>View Tracking:</strong> We track basic view statistics for shared content</li>
                  <li><strong>Automatic Expiration:</strong> Shared content expires after 30 days</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Content Control</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Voluntary Sharing:</strong> All content sharing is voluntary and user-initiated</li>
                  <li><strong>Removal Rights:</strong> You can request removal of shared content at any time</li>
                  <li><strong>Content Moderation:</strong> We reserve the right to remove inappropriate shared content</li>
                </ul>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Caution:</strong> Only share content that you're comfortable making public. 
                    Avoid sharing sensitive, personal, or confidential information.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section id="cookies" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">9. Cookies & Tracking</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Essential Cookies</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use essential cookies to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Authentication:</strong> Maintain your login session and security</li>
                  <li><strong>Preferences:</strong> Remember your settings and preferences</li>
                  <li><strong>Functionality:</strong> Enable core features and functionality</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Analytics and Performance</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Usage Analytics:</strong> Understand how users interact with our service</li>
                  <li><strong>Performance Monitoring:</strong> Monitor service performance and reliability</li>
                  <li><strong>Error Tracking:</strong> Identify and resolve technical issues</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Cookie Management</h3>
                <p className="text-gray-700 leading-relaxed">
                  You can control cookies through your browser settings, but note that disabling essential 
                  cookies may affect service functionality.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section id="data-retention" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">10. Data Retention</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Retention Periods</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Chat History:</strong> Retained indefinitely unless you delete your account</li>
                  <li><strong>Account Data:</strong> Retained while your account is active</li>
                  <li><strong>Shared Content:</strong> Automatically deleted after 30 days</li>
                  <li><strong>Usage Analytics:</strong> Aggregated data retained for up to 2 years</li>
                  <li><strong>Authentication Tokens:</strong> Refreshed regularly, expired tokens are deleted</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Data Deletion</h3>
                <p className="text-gray-700 leading-relaxed">
                  We provide options for data deletion:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Individual Conversations:</strong> Delete specific chat conversations</li>
                  <li><strong>Account Deletion:</strong> Complete account and data deletion upon request</li>
                  <li><strong>Automatic Cleanup:</strong> Regular cleanup of expired and unnecessary data</li>
                </ul>
              </div>
            </section>

            {/* Section 11 */}
            <section id="user-rights" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">11. Your Rights</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Data Access Rights</h3>
                <p className="text-gray-700 leading-relaxed">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Access:</strong> Request access to your personal data</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Receive your data in a portable format</li>
                  <li><strong>Restriction:</strong> Limit how we process your data</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Control Options</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Account Settings:</strong> Manage your preferences and settings</li>
                  <li><strong>Data Export:</strong> Export your chat history and data</li>
                  <li><strong>Service Withdrawal:</strong> Discontinue service and delete data</li>
                  <li><strong>Third-Party Revocation:</strong> Revoke access to integrated services</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Exercising Your Rights</h3>
                <p className="text-gray-700 leading-relaxed">
                  To exercise your rights, contact us through our support channels. We will respond to 
                  your request within 30 days and may require identity verification.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section id="children-privacy" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">12. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                QuestWhisper is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe 
                your child has provided us with personal information, please contact us immediately.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If we discover that a child under 13 has provided us with personal information, we will 
                delete such information from our servers immediately.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  <strong>Age Requirement:</strong> Users must be at least 13 years old to use QuestWhisper. 
                  Users under 18 should have parental consent.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section id="international-transfers" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">13. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure that such transfers comply with applicable data protection laws and implement 
                appropriate safeguards to protect your data.
              </p>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Transfer Safeguards</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Adequate Protection:</strong> Transfers only to countries with adequate data protection</li>
                  <li><strong>Contractual Safeguards:</strong> Standard contractual clauses for international transfers</li>
                  <li><strong>Security Measures:</strong> Consistent security standards across all locations</li>
                  <li><strong>Compliance:</strong> Adherence to international data protection regulations</li>
                </ul>
              </div>
            </section>

            {/* Section 14 */}
            <section id="policy-changes" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">14. Policy Changes</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices 
                or applicable laws. We will notify you of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Posting the updated policy on our website</li>
                <li>Sending email notifications for significant changes</li>
                <li>Providing in-app notifications when you next use the service</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Your continued use of QuestWhisper after any changes to this Privacy Policy constitutes 
                your acceptance of the updated terms.
              </p>
            </section>

            {/* Section 15 */}
            <section id="contact" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">15. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy, your data, or our privacy practices, 
                please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                <p className="text-gray-700"><strong>Support:</strong> support@iwhispered.com</p>
                <p className="text-gray-700"><strong>Website:</strong> https://iwhispered.com</p>
                <p className="text-gray-700"><strong>Service:</strong> QuestWhisper AI Assistant</p>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We are committed to addressing your privacy concerns and will respond to your inquiries 
                within 30 days.
              </p>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 