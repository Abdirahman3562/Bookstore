import { MessageCircle, ExternalLink, Users, Clock, CheckCircle, MessageSquare, ArrowRight, Zap } from "lucide-react";

export default function LiveChatAdmin() {
  // Crisp inbox URL
  const crispInboxUrl = "https://app.crisp.chat/website/5d982106-8342-48e2-b6ab-2b2b405b48ed/inbox/";

  const handleOpenCrisp = () => {
    window.open(crispInboxUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Chat Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View and respond to customer messages in real-time
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Chats</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">Real-time</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">Instant</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">Connected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Crisp Inbox Access */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Access Your Live Chat Inbox
          </h2>
          
          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Manage all customer conversations, view chat history, and respond to messages in real-time through the Crisp dashboard.
          </p>

          {/* CTA Button */}
          <button
            onClick={handleOpenCrisp}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 mb-8"
          >
            <Zap className="w-5 h-5" />
            Open Crisp Inbox
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Real-time Messaging</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Chat with customers instantly as they message you
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Chat History</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View all previous conversations and customer details
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Customer Info</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See customer email, name, and browsing history
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Multi-device Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access your inbox from desktop, tablet, or mobile
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          How to use Live Chat:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-none">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
            <span>Click the "Open Crisp Inbox" button above to access your chat dashboard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
            <span>View all active conversations and customer messages in the Crisp inbox</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
            <span>Click on any conversation to view chat history and respond to customers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
            <span>Customers can start chats from any page on the website using the chat button</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold">5.</span>
            <span>All conversations are saved and accessible anytime in your Crisp dashboard</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

