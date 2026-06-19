import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
const faqs = [
{
  question: 'Is this legal?',
  answer:
  'Session Share operates in a gray area of account sharing. We use advanced session management to share access without exposing credentials. However, it violates the Terms of Service of most platforms. Use at your own discretion.'
},
{
  question: 'How secure is my data?',
  answer:
  'We never store your personal passwords. The extension uses encrypted session tokens to authenticate you directly with the services. Your browsing data remains private.'
},
{
  question: 'Can I use it on mobile?',
  answer:
  'Currently, Session Share is available as a browser extension for desktop (Chrome, Firefox, Edge, Brave). A mobile solution is in active development.'
},
{
  question: 'What happens if a service goes down?',
  answer:
  'We monitor all services 24/7. If a shared account gets flagged or locked, our automated systems rotate it with a fresh one, usually within minutes.'
}];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section className="py-24 px-6 max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) =>
        <div
          key={index}
          className="glass-card rounded-2xl overflow-hidden border border-white/10">
          
            <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none">
            
              <span className="font-semibold text-lg">{faq.question}</span>
              <ChevronDown
              className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} />
            
            </button>

            <AnimatePresence>
              {openIndex === index &&
            <motion.div
              initial={{
                height: 0,
                opacity: 0
              }}
              animate={{
                height: 'auto',
                opacity: 1
              }}
              exit={{
                height: 0,
                opacity: 0
              }}
              transition={{
                duration: 0.3
              }}>
              
                  <div className="px-6 pb-5 text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
            }
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>);

}