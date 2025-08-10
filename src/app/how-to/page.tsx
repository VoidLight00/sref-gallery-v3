import Header from '@/components/layout/Header';
import Link from 'next/link';

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            📚 How to Use SREF Codes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Learn how to use Midjourney style reference codes effectively to create 
            consistent, high-quality AI-generated artwork.
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            Quick Start Guide
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Find Your Perfect Style
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Browse our gallery and find a SREF code that matches your desired art style.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Copy the SREF Code
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Click the copy button on any SREF card to copy the code to your clipboard.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Add to Your Midjourney Prompt
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Paste the SREF code at the end of your Midjourney prompt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Instructions */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <span className="text-3xl">🔧</span>
            Detailed Instructions
          </h2>

          <div className="space-y-8">
            {/* Basic Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Basic SREF Usage
              </h3>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <code className="text-green-600 dark:text-green-400 text-sm">
                  /imagine a beautiful landscape --sref 1234567890
                </code>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Simply add <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">--sref</code> followed 
                by the SREF code at the end of your prompt. This will apply the style reference to your generated image.
              </p>

              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <span className="text-blue-500 text-xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Pro Tip</h4>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      SREF codes work best when your prompt describes what you want to create, 
                      while the SREF code defines how it should look.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Advanced Techniques
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Style Weight Control
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-2">
                    <code className="text-green-600 dark:text-green-400 text-sm">
                      /imagine a portrait --sref 1234567890 --sw 50
                    </code>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Use <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">--sw</code> (0-1000) 
                    to control how strongly the style is applied. Lower values = subtle influence, higher values = stronger style.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Multiple Style References
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-2">
                    <code className="text-green-600 dark:text-green-400 text-sm">
                      /imagine a cityscape --sref 1234567890 9876543210 --sw 75
                    </code>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Combine multiple SREF codes by separating them with spaces to blend different styles.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Character References
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-2">
                    <code className="text-green-600 dark:text-green-400 text-sm">
                      /imagine a warrior --sref 1234567890 --cref URL --cw 100
                    </code>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Combine SREF (style) with CREF (character) references for consistent character styling.
                  </p>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Best Practices
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                    <span>✅</span> Do&apos;s
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Test different style weights (--sw) to find the perfect balance</li>
                    <li>• Use descriptive prompts that complement the SREF style</li>
                    <li>• Save successful prompt + SREF combinations</li>
                    <li>• Experiment with multiple SREF codes for unique blends</li>
                    <li>• Check the preview images to understand the style</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                    <span>❌</span> Don&apos;ts
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Don&apos;t use conflicting style descriptions in your prompt</li>
                    <li>• Don&apos;t set style weight too high (&gt;800) unless needed</li>
                    <li>• Don&apos;t combine too many SREF codes (max 3-4)</li>
                    <li>• Don&apos;t ignore the original prompt - both matter!</li>
                    <li>• Don&apos;t expect identical results - embrace variation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <span className="text-3xl">❓</span>
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                question: "What is a SREF code?",
                answer: "SREF (Style Reference) codes are unique identifiers that tell Midjourney to apply a specific artistic style to your generated images. Each code corresponds to a particular visual aesthetic."
              },
              {
                question: "Can I use multiple SREF codes together?",
                answer: "Yes! You can combine multiple SREF codes by separating them with spaces. This allows you to blend different styles, but be careful not to use too many as they might conflict."
              },
              {
                question: "What does the style weight (--sw) parameter do?",
                answer: "Style weight controls how strongly the SREF style influences your image. Values range from 0-1000, with 100 being the default. Lower values apply the style more subtly."
              },
              {
                question: "Why don't my results look exactly like the preview images?",
                answer: "SREF codes influence style, not content. The preview images are just examples. Your results will have the same artistic style but applied to your specific prompt content."
              },
              {
                question: "Do SREF codes work with all Midjourney versions?",
                answer: "SREF codes work best with Midjourney v6 and later. Some codes may produce different results or not work at all with older versions."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                    <h3 className="font-semibold text-gray-900 dark:text-white pr-8">
                      {faq.question}
                    </h3>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 pt-0 text-gray-600 dark:text-gray-300">
                    {faq.answer}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Create Amazing Art?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Now that you know how to use SREF codes, explore our gallery and start creating 
            stunning AI artwork with consistent styles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/discover"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Browse SREF Gallery
            </Link>
            <Link
              href="/categories"
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Explore by Category
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}