"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
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
              Terms of Service
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
              <a href="#acceptance" className="text-blue-600 hover:text-blue-800 transition-colors">1. Acceptance of Terms</a>
              <a href="#service-description" className="text-blue-600 hover:text-blue-800 transition-colors">2. Service Description</a>
              <a href="#ai-capabilities" className="text-blue-600 hover:text-blue-800 transition-colors">3. AI Capabilities & Access</a>
              <a href="#data-collection" className="text-blue-600 hover:text-blue-800 transition-colors">4. Data Collection & Storage</a>
              <a href="#user-accounts" className="text-blue-600 hover:text-blue-800 transition-colors">5. User Accounts & Authentication</a>
              <a href="#workspace-integration" className="text-blue-600 hover:text-blue-800 transition-colors">6. Workspace Integration</a>
              <a href="#voice-processing" className="text-blue-600 hover:text-blue-800 transition-colors">7. Voice Processing & Audio</a>
              <a href="#content-sharing" className="text-blue-600 hover:text-blue-800 transition-colors">8. Content Sharing Features</a>
              <a href="#user-conduct" className="text-blue-600 hover:text-blue-800 transition-colors">9. User Conduct</a>
              <a href="#intellectual-property" className="text-blue-600 hover:text-blue-800 transition-colors">10. Intellectual Property</a>
              <a href="#disclaimers" className="text-blue-600 hover:text-blue-800 transition-colors">11. Disclaimers & Limitations</a>
              <a href="#termination" className="text-blue-600 hover:text-blue-800 transition-colors">12. Termination</a>
              <a href="#changes" className="text-blue-600 hover:text-blue-800 transition-colors">13. Changes to Terms</a>
              <a href="#contact" className="text-blue-600 hover:text-blue-800 transition-colors">14. Contact Information</a>
            </div>
          </motion.div>

          {/* Terms Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            {/* Section 1 */}
            <section id="acceptance" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using QuestWhisper ("the Service"), you accept and agree to be bound by 
                the terms and provision of this agreement. These Terms of Service govern your use of our 
                AI-powered assistant platform.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If you do not agree to abide by the above, please do not use this service. Your continued 
                use of the Service following the posting of changes to these terms will be deemed your 
                acceptance of those changes.
              </p>
            </section>

            {/* Section 2 */}
            <section id="service-description" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">2. Service Description</h2>
              <p className="text-gray-700 leading-relaxed">
                QuestWhisper is an AI-powered conversational assistant that provides:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Intelligent conversation and responses using advanced AI technology</li>
                <li>Voice-to-text and text-to-speech capabilities</li>
                <li>Integration with Google Workspace services (Gmail, Drive, Docs, Sheets, Calendar, Forms, Slides)</li>
                <li>Web search and content extraction capabilities</li>
                <li>Chat history management and conversation persistence</li>
                <li>Content sharing and collaboration features</li>
                <li>Image search capabilities</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="ai-capabilities" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">3. AI Capabilities & Access</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">AI Technology</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our Service utilizes advanced AI models and machine learning technology to provide:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Text-based conversations:</strong> Intelligent responses and function execution</li>
                  <li><strong>Voice interactions:</strong> Real-time voice processing and audio generation</li>
                </ul>
                
                <h3 className="text-xl font-semibold text-gray-800">AI Capabilities & Access</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our AI assistant can perform the following actions on your behalf when requested:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Search the web and extract content from webpages</li>
                  <li>Access your Google account services (with your explicit permission)</li>
                  <li>Read, compose, and send emails through Gmail</li>
                  <li>Create, read, and modify Google Docs, Sheets, and Slides</li>
                  <li>Schedule and manage calendar events</li>
                  <li>Create and manage Google Forms</li>
                  <li>Search and access files in Google Drive</li>
                  <li>Find and suggest images from available sources</li>
                  <li>Analyze and work with data from your Google Sheets and documents</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section id="data-collection" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">4. Data Collection & Storage</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">What We Store</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Chat Messages:</strong> All conversations between you and the AI are stored securely in our databases</li>
                  <li><strong>User Profile:</strong> Your name, profile image, and user preferences</li>
                  <li><strong>Authentication Tokens:</strong> Secure tokens for accessing your Google services</li>
                  <li><strong>Shared Content:</strong> Content you choose to share publicly through our sharing features</li>
                  <li><strong>Usage Analytics:</strong> Basic usage patterns to improve our service</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">What We Do NOT Store</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Email Content:</strong> We access emails only during your session and do not store email content</li>
                  <li><strong>Files:</strong> We do not store your Google Drive files or documents</li>
                  <li><strong>Voice Recordings:</strong> Audio input is processed in real-time and not recorded or stored</li>
                  <li><strong>Permanent Access:</strong> We only access your Google services during active sessions with your consent</li>
                </ul>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm">
                    <strong>Privacy Commitment:</strong> Your email addresses, file contents, and personal documents 
                    are fetched only when needed for your specific requests and are never stored outside of your active session.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="user-accounts" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">5. User Accounts & Authentication</h2>
              <p className="text-gray-700 leading-relaxed">
                QuestWhisper uses secure third-party authentication. By signing in, you authorize us to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access your basic profile information (name, email, profile picture)</li>
                <li>Maintain your authentication session for seamless service access</li>
                <li>Store minimal user preferences and settings</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                You are responsible for maintaining the security of your account. We recommend using 
                strong passwords and enabling two-factor authentication.
              </p>
            </section>

            {/* Section 6 */}
            <section id="workspace-integration" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">6. Workspace Integration</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Required Permissions</h3>
                <p className="text-gray-700 leading-relaxed">
                  To provide our services, we request access to specific workspace APIs:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Email:</strong> Read and send emails, search email content</li>
                  <li><strong>File Storage:</strong> Access and search files, create new documents</li>
                  <li><strong>Documents:</strong> Create, read, and edit documents</li>
                  <li><strong>Spreadsheets:</strong> Read and analyze spreadsheet data</li>
                  <li><strong>Calendar:</strong> Read events and create new calendar entries</li>
                  <li><strong>Presentations:</strong> Create and modify presentations</li>
                  <li><strong>Forms:</strong> Create forms and access responses</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Data Usage</h3>
                <p className="text-gray-700 leading-relaxed">
                  We access your workspace services only to fulfill your specific requests. All actions are performed 
                  with your explicit consent and during your active session. We do not access your data 
                  for any other purpose.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section id="voice-processing" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">7. Voice Processing & Audio</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Voice Input</h3>
                <p className="text-gray-700 leading-relaxed">
                  Our voice feature processes your speech in real-time using advanced speech recognition technology. 
                  Voice input is converted to text immediately and the audio is not stored or recorded.
                </p>

                <h3 className="text-xl font-semibold text-gray-800">Text-to-Speech</h3>
                <p className="text-gray-700 leading-relaxed">
                  AI responses can be converted to speech using text-to-speech technology. Audio output 
                  is generated in real-time and streamed directly to your device without being stored.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Privacy Notice:</strong> We do not record, store, or analyze your voice input. 
                    All voice processing is handled securely and discarded after processing.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="content-sharing" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">8. Content Sharing Features</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Public Sharing</h3>
                <p className="text-gray-700 leading-relaxed">
                  You may choose to share AI responses publicly through our sharing feature. When you share content:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>The shared content becomes publicly accessible via a unique URL</li>
                  <li>We store the content, title, sources, and your name as the sharer</li>
                  <li>Shared content expires automatically after 30 days</li>
                  <li>We track basic view statistics for shared content</li>
                  <li>You retain the right to request removal of shared content</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Content Responsibility</h3>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for the content you choose to share. Do not share sensitive, private, 
                  or confidential information. We reserve the right to remove shared content that violates 
                  our terms or applicable laws.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section id="user-conduct" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">9. User Conduct</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Generate harmful, illegal, or inappropriate content</li>
                <li>Attempt to circumvent security measures or access unauthorized data</li>
                <li>Share false, misleading, or defamatory information</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Spam or abuse the Service or other users</li>
                <li>Attempt to reverse engineer or replicate the Service</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="intellectual-property" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">10. Intellectual Property</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Service Ownership</h3>
                <p className="text-gray-700 leading-relaxed">
                  QuestWhisper and its original content, features, and functionality are owned by QuestWhisper 
                  and are protected by international copyright, trademark, patent, trade secret, and other 
                  intellectual property or proprietary rights laws.
                </p>

                <h3 className="text-xl font-semibold text-gray-800">User Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  You retain ownership of any content you input into the Service. By using the Service, you 
                  grant us a limited license to process and store your content solely to provide the Service 
                  to you. AI-generated responses are not considered your intellectual property.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section id="disclaimers" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">11. Disclaimers & Limitations</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">AI Limitations</h3>
                <p className="text-gray-700 leading-relaxed">
                  QuestWhisper is powered by AI technology that may:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide inaccurate or incomplete information</li>
                  <li>Make mistakes in data analysis or calculations</li>
                  <li>Misinterpret your requests or context</li>
                  <li>Generate biased or inappropriate responses</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800">Service Availability</h3>
                <p className="text-gray-700 leading-relaxed">
                  We strive to provide reliable service but cannot guarantee 100% uptime. The Service may be 
                  temporarily unavailable due to maintenance, updates, or technical issues.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">
                    <strong>Important:</strong> Always verify important information and do not rely solely 
                    on AI responses for critical decisions, especially regarding health, legal, or financial matters.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 12 */}
            <section id="termination" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">12. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account and access to the Service at our sole discretion, 
                without prior notice, for conduct that we believe violates these Terms or is harmful to 
                other users, us, or third parties, or for any other reason.
              </p>
              <p className="text-gray-700 leading-relaxed">
                You may terminate your account at any time by discontinuing use of the Service and revoking 
                API access permissions. Upon termination, your chat history and shared content may 
                be deleted according to our data retention policies.
              </p>
            </section>

            {/* Section 13 */}
            <section id="changes" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">13. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days notice prior to any new terms taking effect. What constitutes 
                a material change will be determined at our sole discretion.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By continuing to access or use our Service after any revisions become effective, you agree 
                to be bound by the revised terms.
              </p>
            </section>

            {/* Section 14 */}
            <section id="contact" className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">14. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                <p className="text-gray-700"><strong>Email:</strong> support@iwhispered.com</p>
                <p className="text-gray-700"><strong>Website:</strong> https://iwhispered.com</p>
                <p className="text-gray-700"><strong>Service:</strong> QuestWhisper AI Assistant</p>
              </div>
            </section>
          </motion.div>
        </div>
      </main>
    </div>
  );
} 