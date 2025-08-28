
import { Question, InterviewCategory } from './types';

export const PRO_TIPS: string[] = [
  "Network relentlessly. Reach out to PMs on LinkedIn for informational interviews. Ask about their journey, not for a job.",
  "Develop 'product sense' by deconstructing your favorite apps. Ask 'why' for every feature. Who is it for? What problem does it solve? How does it impact business metrics?",
  "Master storytelling. Your resume, interview answers, and even daily stand-ups are stories. Frame your experience using the STAR method (Situation, Task, Action, Result).",
  "Build something, anything! A simple website, a no-code app, or even a detailed product spec for a side project demonstrates initiative and your ability to ship.",
  "Don't just learn frameworks like CIRCLES or AARM, understand the 'why' behind them. They are tools for structured thinking, not a script to be memorized.",
  "Read voraciously. 'Inspired' by Marty Cagan, 'The Lean Startup' by Eric Ries, and 'Hooked' by Nir Eyal are your new best friends."
];

export const QUESTION_BANK: Question[] = [
  // Product Sense
  { text: "How would you improve YouTube Shorts?", category: InterviewCategory.PRODUCT_SENSE, company: "Google", difficulty: "Medium" },
  { text: "You're the PM for Instagram Stories. What's the next big feature you'd build?", category: InterviewCategory.PRODUCT_SENSE, company: "Meta", difficulty: "Medium" },
  { text: "Should Netflix get into gaming? If so, how?", category: InterviewCategory.PRODUCT_SENSE, company: "Netflix", difficulty: "Hard" },
  { text: "Design a product for solo travelers.", category: InterviewCategory.PRODUCT_SENSE, company: "General", difficulty: "Easy" },
  { text: "How would you improve Google Maps for electric vehicle owners?", category: InterviewCategory.PRODUCT_SENSE, company: "Google", difficulty: "Medium" },
  { text: "Imagine you are the PM for TikTok. What would you build to monetize the platform further?", category: InterviewCategory.PRODUCT_SENSE, company: "TikTok", difficulty: "Hard" },
  { text: "What's a product you love? Why? How would you improve it?", category: InterviewCategory.PRODUCT_SENSE, company: "General", difficulty: "Easy" },
  { text: "Design a feature for Airbnb to help guests feel more like locals.", category: InterviewCategory.PRODUCT_SENSE, company: "Airbnb", difficulty: "Medium" },
  { text: "How would you improve the Amazon shopping experience on mobile?", category: InterviewCategory.PRODUCT_SENSE, company: "Amazon", difficulty: "Medium" },
  { text: "Design a product to help people learn a new language.", category: InterviewCategory.PRODUCT_SENSE, company: "General", difficulty: "Easy" },
  { text: "What would you build to improve the job search experience on LinkedIn?", category: InterviewCategory.PRODUCT_SENSE, company: "Microsoft", difficulty: "Medium" },
  { text: "Imagine you are the PM for Spotify Podcasts. What feature would you build next?", category: InterviewCategory.PRODUCT_SENSE, company: "Spotify", difficulty: "Medium" },
  { text: "How would you monetize a free-to-use meditation app like Calm without using ads?", category: InterviewCategory.PRODUCT_SENSE, company: "Calm", difficulty: "Hard" },

  // Root Cause Analysis (RCA)
  { text: "There is a 10% drop in food delivery orders on Swiggy. How would you investigate?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "Swiggy", difficulty: "Medium" },
  { text: "User engagement on Facebook Marketplace has dropped by 15% WoW. What's the root cause?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "Meta", difficulty: "Medium" },
  { text: "Our server costs for AWS have unexpectedly doubled last month. Why?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "Amazon", difficulty: "Hard" },
  { text: "The number of 'likes' on Instagram posts has decreased by 5% in the last week. Why?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "Meta", difficulty: "Medium" },
  { text: "Your e-commerce site's 'Add to Cart' conversion rate dropped by 20% overnight. Investigate.", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "General", difficulty: "Medium" },
  { text: "Customer support ticket volume for your SaaS product has increased by 30%. What's happening?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "General", difficulty: "Hard" },
  { text: "A ride-sharing app sees a sudden spike in cancellations. What are the potential reasons?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "Uber", difficulty: "Medium" },
  { text: "The average session duration for a meditation app has gone down. Why?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "Calm", difficulty: "Easy" },
  { text: "The number of new users signing up for your SaaS product has dropped by 20% this month. Investigate.", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "SaaS", difficulty: "Medium" },
  { text: "There's a 30% increase in cart abandonment rate on an e-commerce website. Why?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "General", difficulty: "Medium" },
  { text: "Your app's rating on the Google Play Store dropped from 4.5 to 3.8 in a week. What happened?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "General", difficulty: "Hard" },
  { text: "Users are spending less time on the Netflix homepage. How would you diagnose the problem?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "Netflix", difficulty: "Medium" },
  { text: "The churn rate for your subscription service has increased by 5%. What are the potential causes?", category: InterviewCategory.ROOT_CAUSE_ANALYSIS, company: "General", difficulty: "Medium" },

  // Product Design
  { text: "Design a new feature for Spotify to enhance music discovery for niche genres.", category: InterviewCategory.PRODUCT_DESIGN, company: "Spotify", difficulty: "Medium" },
  { text: "Design a feature for LinkedIn to help people find mentors.", category: InterviewCategory.PRODUCT_DESIGN, company: "Microsoft", difficulty: "Medium" },
  { text: "Design an app for tourists visiting a new city.", category: InterviewCategory.PRODUCT_DESIGN, company: "General", difficulty: "Easy" },
  { text: "Design a mobile banking app for teenagers.", category: InterviewCategory.PRODUCT_DESIGN, company: "Fintech", difficulty: "Medium" },
  { text: "Design a smart home device for elderly people living alone.", category: InterviewCategory.PRODUCT_DESIGN, company: "Google", difficulty: "Hard" },
  { text: "Design a solution to reduce food waste in households.", category: InterviewCategory.PRODUCT_DESIGN, company: "General", difficulty: "Medium" },
  { text: "Design a feature for a ride-sharing app to improve safety for female passengers.", category: InterviewCategory.PRODUCT_DESIGN, company: "Uber", difficulty: "Medium" },
  { text: "Design a digital resume builder.", category: InterviewCategory.PRODUCT_DESIGN, company: "General", difficulty: "Easy" },
  { text: "Design a feature for Google Photos to help users rediscover memories.", category: InterviewCategory.PRODUCT_DESIGN, company: "Google", difficulty: "Medium" },
  { text: "Design a better alarm clock app.", category: InterviewCategory.PRODUCT_DESIGN, company: "General", difficulty: "Easy" },
  { text: "Design a loyalty program for a coffee shop chain.", category: InterviewCategory.PRODUCT_DESIGN, company: "General", difficulty: "Medium" },
  { text: "Design a product to help users manage their personal finances and budget.", category: InterviewCategory.PRODUCT_DESIGN, company: "Fintech", difficulty: "Medium" },
  { text: "Design an interface for a self-driving car.", category: InterviewCategory.PRODUCT_DESIGN, company: "Tesla", difficulty: "Hard" },

  // Product Strategy
  { text: "You are the CEO of Slack. How do you plan to compete with Microsoft Teams?", category: InterviewCategory.PRODUCT_STRATEGY, company: "Salesforce", difficulty: "Hard" },
  { text: "What is Google's 5-year strategy for the Pixel phone?", category: InterviewCategory.PRODUCT_STRATEGY, company: "Google", difficulty: "Hard" },
  { text: "How would you price a new B2B SaaS product for project management?", category: InterviewCategory.PRODUCT_STRATEGY, company: "General", difficulty: "Medium" },
  { text: "If you were the CEO of Twitter (X), what would be your strategy for the next 2 years?", category: InterviewCategory.PRODUCT_STRATEGY, company: "X", difficulty: "Hard" },
  { text: "Should Amazon launch a new streaming service dedicated to sports? Why or why not?", category: InterviewCategory.PRODUCT_STRATEGY, company: "Amazon", difficulty: "Hard" },
  { text: "How would you launch a new food delivery service in a market dominated by Zomato and Swiggy?", category: InterviewCategory.PRODUCT_STRATEGY, company: "Startup", difficulty: "Medium" },
  { text: "What's your strategy for growing a niche B2B SaaS product from 100 to 1000 customers?", category: InterviewCategory.PRODUCT_STRATEGY, company: "SaaS", difficulty: "Medium" },
  { text: "Evaluate the strategic decision of Microsoft to acquire Activision Blizzard.", category: InterviewCategory.PRODUCT_STRATEGY, company: "Microsoft", difficulty: "Hard" },
  { text: "You are the PM for a new startup entering the competitive note-taking app market (like Notion, Evernote). What's your go-to-market strategy?", category: InterviewCategory.PRODUCT_STRATEGY, company: "Startup", difficulty: "Medium" },
  { text: "Should Apple build a search engine?", category: InterviewCategory.PRODUCT_STRATEGY, company: "Apple", difficulty: "Hard" },
  { text: "What's your strategy to increase the adoption of Google Workspace among startups?", category: InterviewCategory.PRODUCT_STRATEGY, company: "Google", difficulty: "Medium" },
  { text: "How would you position a new streaming service against giants like Netflix and Disney+?", category: InterviewCategory.PRODUCT_STRATEGY, company: "General", difficulty: "Hard" },
  { text: "Develop a 3-year product strategy for a food-tech company like Zomato.", category: InterviewCategory.PRODUCT_STRATEGY, company: "Zomato", difficulty: "Hard" },

  // Estimation
  { text: "Estimate the number of Uber rides in Delhi on a typical weekday.", category: InterviewCategory.ESTIMATION, company: "Uber", difficulty: "Medium" },
  { text: "Estimate the total storage space required for all photos uploaded to Instagram in a day.", category: InterviewCategory.ESTIMATION, company: "Meta", difficulty: "Hard" },
  { text: "Estimate the monthly revenue of a popular coffee shop in Bangalore.", category: InterviewCategory.ESTIMATION, company: "General", difficulty: "Easy" },
  { text: "Estimate the number of windows in New York City.", category: InterviewCategory.ESTIMATION, company: "General", difficulty: "Hard" },
  { text: "Estimate the daily revenue of the Indian Railways.", category: InterviewCategory.ESTIMATION, company: "Govt.", difficulty: "Hard" },
  { text: "Estimate the amount of paint required to paint all commercial airplanes in the world.", category: InterviewCategory.ESTIMATION, company: "General", difficulty: "Medium" },
  { text: "Estimate the number of pizzas ordered in Mumbai on a Friday night.", category: InterviewCategory.ESTIMATION, company: "Zomato", difficulty: "Medium" },
  { text: "Estimate the market size for online fitness coaching in India.", category: InterviewCategory.ESTIMATION, company: "Startup", difficulty: "Medium" },
  { text: "Estimate the number of streetlights in Mumbai.", category: InterviewCategory.ESTIMATION, company: "General", difficulty: "Medium" },
  { text: "Estimate the daily data consumption from YouTube in India.", category: InterviewCategory.ESTIMATION, company: "Google", difficulty: "Hard" },
  { text: "Estimate the number of developers in India.", category: InterviewCategory.ESTIMATION, company: "General", difficulty: "Medium" },
  { text: "Estimate the annual revenue of the Taj Mahal.", category: InterviewCategory.ESTIMATION, company: "General", difficulty: "Easy" },
  { text: "Estimate the number of WhatsApp messages sent globally every hour.", category: InterviewCategory.ESTIMATION, company: "Meta", difficulty: "Hard" },
];