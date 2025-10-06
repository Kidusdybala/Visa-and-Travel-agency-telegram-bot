const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

const token = '8413695591:AAEoZpel959v8gO-I5Zb1GCPmJESmHimgjQ';

console.log('Initializing bot with token:', token.substring(0, 10) + '...'); // Log partial token for security

const bot = new TelegramBot(token, {polling: true});

const userStates = new Map();

const app = express();
app.use(express.static('public'));
app.listen(3000, () => {
  console.log('Web app running on port 3000');
});

console.log('Bot is running and polling started...');

// Log successful polling start
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Log when bot receives updates
bot.on('message', (msg) => {
  console.log(`Received message from ${msg.from.id}: ${msg.text}`);
});

// Command handlers
bot.onText(/\/start/, (msg) => {
  const welcomeText = `🌍 **Visa & Travel Agency Bot** 🌍

Welcome! We're here to help you with all your visa and travel needs.

✈️ **What we offer:**
• Visa applications for 150+ countries
• Flight and hotel bookings
• Travel insurance and packages
• 24/7 customer support

Ready to get started? Click below to access our full service portal!`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{text: '🚀 Open Service Portal', web_app: {url: 'https://grapiest-nonfatally-ema.ngrok-free.dev'}}],
        [{text: '📋 My Applications', callback_data: 'applications'}]
      ]
    },
    parse_mode: 'Markdown'
  };
  bot.sendMessage(msg.chat.id, welcomeText, options);
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, '🆘 **Need Help?**\n\n📋 **Available Commands:**\n/start - Welcome message and service portal\n/help - Show this help message\n/book - Start visa application process\n/support - Contact customer support\n\n💡 **Tip:** Use /start to access our full web portal for the best experience!');
});

bot.onText(/\/book/, (msg) => {
  console.log(`User ${msg.from.id} started booking`);
  userStates.set(msg.from.id, {step: 'destination'});
  bot.sendMessage(msg.chat.id, '📍 Where would you like to travel to? Please enter your destination country:');
});

bot.onText(/\/support/, (msg) => {
  console.log(`User ${msg.from.id} requested support`);
  userStates.set(msg.from.id, {step: 'support'});
  bot.sendMessage(msg.chat.id, '💬 How can we help you today? Please describe your question or issue:');
});

// Callback query handler
bot.on('callback_query', (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  if (data === 'book') {
    console.log(`User ${userId} started booking via menu`);
    userStates.set(userId, {step: 'destination'});
    bot.sendMessage(chatId, '📝 Let\'s get your visa application started! What country would you like to apply for?');
  } else if (data === 'support') {
    console.log(`User ${userId} requested support via menu`);
    userStates.set(userId, {step: 'support'});
    bot.sendMessage(chatId, '🆘 Need help? Tell us what you need assistance with and we\'ll get back to you right away!');
  } else if (data === 'help') {
    bot.sendMessage(chatId, '📋 **Available Services:**\n• Visa Applications - Apply for visas to any country\n• Travel Booking - Flights, hotels, and packages\n• Customer Support - 24/7 assistance\n• Application Tracking - Check your submission status\n\nUse /start to access our full service portal!');
  } else if (data === 'about') {
    bot.sendMessage(chatId, '🏢 **About Visa & Travel Agency**\nWe\'re a trusted visa and travel agency with over 10 years of experience. Based in Addis Ababa, Ethiopia, we specialize in:\n• Visa applications for 150+ countries\n• International travel planning\n• Document preparation\n• 24/7 customer support\n\n📞 Contact: info@visagency.com\n🌐 Visit our website for more services!');
  } else if (data === 'applications') {
    // Fetch applications from API
    axios.get(`http://localhost:3000/api/applications/${userId}`)
      .then(response => {
        const applications = response.data;
        let appList = `📋 **My Visa Applications**\n\n`;
        if (applications.length === 0) {
          appList += 'No applications found.';
        } else {
          applications.forEach(app => {
            const statusEmoji = {
              'review': '⏳',
              'approved': '✅',
              'rejected': '❌',
              'confirmed': '🎉'
            }[app.status] || '❓';
            appList += `${statusEmoji} ${app.type} to ${app.destination} - ${app.details}\nStatus: ${app.status}\n\n`;
          });
        }
        const filterOptions = {
          reply_markup: {
            inline_keyboard: [
              [{text: 'All', callback_data: 'filter_all'}],
              [{text: 'In Review', callback_data: 'filter_review'}],
              [{text: 'Approved', callback_data: 'filter_approved'}],
              [{text: 'Rejected', callback_data: 'filter_rejected'}]
            ]
          },
          parse_mode: 'Markdown'
        };
        bot.sendMessage(chatId, appList, filterOptions);
      })
      .catch(error => {
        console.error('Error fetching applications:', error);
        bot.sendMessage(chatId, '❌ Error loading applications. Please try again later.');
      });
  } else if (data === 'confirm_yes') {
    const state = userStates.get(userId);
    if (state && state.step === 'confirm') {
      bot.sendMessage(chatId, '✅ Great! Your visa application has been confirmed. Let\'s proceed with payment.');
      state.step = 'payment';
      bot.sendMessage(chatId, '💳 Please provide your payment details (for demo: just enter any number):');
    }
  } else if (data === 'confirm_no') {
    userStates.delete(userId);
    bot.sendMessage(chatId, '❌ No problem! Your booking has been cancelled. Feel free to start over anytime with /start');
  } else if (data === 'filter_all') {
    const appList = `
📋 **All Applications**

Visa to USA - Tourist
In Review

Visa to Canada - Business
Approved

Visa to UK - Student
Rejected

Visa to Germany - Work
In Review

Visa to Australia - Visitor
Approved
    `;
    bot.editMessageText(appList, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [{text: 'All', callback_data: 'filter_all'}],
          [{text: 'In Review', callback_data: 'filter_review'}],
          [{text: 'Approved', callback_data: 'filter_approved'}],
          [{text: 'Rejected', callback_data: 'filter_rejected'}]
        ]
      },
      parse_mode: 'Markdown'
    });
  } else if (data === 'filter_review') {
    const appList = `
📋 **In Review Applications**

Visa to USA - Tourist
In Review

Visa to Germany - Work
In Review
    `;
    bot.editMessageText(appList, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [{text: 'All', callback_data: 'filter_all'}],
          [{text: 'In Review', callback_data: 'filter_review'}],
          [{text: 'Approved', callback_data: 'filter_approved'}],
          [{text: 'Rejected', callback_data: 'filter_rejected'}]
        ]
      },
      parse_mode: 'Markdown'
    });
  } else if (data === 'filter_approved') {
    const appList = `
📋 **Approved Applications**

Visa to Canada - Business
Approved

Visa to Australia - Visitor
Approved
    `;
    bot.editMessageText(appList, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [{text: 'All', callback_data: 'filter_all'}],
          [{text: 'In Review', callback_data: 'filter_review'}],
          [{text: 'Approved', callback_data: 'filter_approved'}],
          [{text: 'Rejected', callback_data: 'filter_rejected'}]
        ]
      },
      parse_mode: 'Markdown'
    });
  } else if (data === 'filter_rejected') {
    const appList = `
📋 **Rejected Applications**

Visa to UK - Student
Rejected
    `;
    bot.editMessageText(appList, {
      chat_id: chatId,
      message_id: query.message.message_id,
      reply_markup: {
        inline_keyboard: [
          [{text: 'All', callback_data: 'filter_all'}],
          [{text: 'In Review', callback_data: 'filter_review'}],
          [{text: 'Approved', callback_data: 'filter_approved'}],
          [{text: 'Rejected', callback_data: 'filter_rejected'}]
        ]
      },
      parse_mode: 'Markdown'
    });
  }

  bot.answerCallbackQuery(query.id);
});

// Message handler for booking flow
bot.on('message', (msg) => {
  if (msg.text && msg.text.startsWith('/')) return; // Ignore commands

  if (userStates.has(msg.from.id)) {
    const state = userStates.get(msg.from.id);
    if (state.step === 'destination') {
      state.destination = msg.text;
      state.step = 'dates';
      bot.sendMessage(msg.chat.id, '📅 Great! Now please enter your travel dates (e.g., 2025-10-10 to 2025-10-15):');
    } else if (state.step === 'dates') {
      state.dates = msg.text;
      state.step = 'confirm';
      const options = {
        reply_markup: {
          inline_keyboard: [
            [{text: '✅ Yes, proceed', callback_data: 'confirm_yes'}],
            [{text: '❌ Cancel', callback_data: 'confirm_no'}]
          ]
        }
      };
      bot.sendMessage(msg.chat.id, `✈️ **Booking Summary:**
📍 Destination: ${state.destination}
📅 Dates: ${state.dates}

Is this information correct?`, options);
    } else if (state.step === 'payment') {
      console.log(`User ${msg.from.id} completed payment`);
      bot.sendMessage(msg.chat.id, '🎉 Payment processed successfully! Your visa application has been submitted and is now under review. You\'ll receive updates via email within 24 hours.');
      userStates.delete(msg.from.id);
    } else if (state.step === 'support') {
      console.log(`User ${msg.from.id} support message: ${msg.text}`);
      bot.sendMessage(msg.chat.id, '🙏 Thank you for reaching out! Our support team has received your message and will get back to you within 2-4 hours. For urgent matters, please call our hotline.');
      userStates.delete(msg.from.id);
    }
  }
});

// Basic error handling
bot.on('polling_error', (error) => {
  console.log(error);
});