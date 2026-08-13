import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ru' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
}

export const LANGUAGES: Record<Language, LanguageOption> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    description: 'United States & Global English'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    description: 'Русскоязычный интерфейс'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    description: 'Español internacional'
  }
};

const LANGUAGE_STORAGE_KEY = 'ton_travel_user_language_v1';

export function loadSavedLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (saved && (saved === 'en' || saved === 'ru' || saved === 'es')) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load saved language:', e);
  }
  return 'en';
}

export function saveLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (e) {
    console.warn('Failed to save language preference:', e);
  }
}

export const translations = {
  en: {
    // Header & Brand
    'app.title': 'TON Travel',
    'app.subtitle': 'Telegram Travel Mini App',
    'app.bot': 'bot • 3M+ Hotels',
    'header.rate': '1 TON = ${price}',
    'header.premium_active': 'Premium (8% TON Cashback)',
    'header.standard_active': 'Standard (5% Cashback)',
    'header.connect_wallet': 'Connect Wallet',
    'header.switch_wallet': 'Switch Wallet',
    'header.sync_drive': 'Sync Drive',
    'header.drive_connected': 'Drive Connected',
    'header.language': 'Language',
    'header.theme': 'Theme',
    'header.currency': 'Currency',

    // Bottom Navigation Tabs
    'tab.hotels': 'Hotels',
    'tab.map': 'Explore Map',
    'tab.wallet': 'Wallet',
    'tab.stays': 'My Stays',

    // Hero Banner
    'hero.badge': 'Telegram Travel Mini App',
    'hero.title': 'Book 3M+ Hotels Worldwide.\nEarn TON Cashback Direct to Wallet.',
    'hero.description': 'Pay with TON, USDT on TON, or card. Telegram Premium members earn {premiumRate}% TON cashback plus up to +3.5% Frequent Traveler bonus on every booking!',
    'hero.badge_premium': '👑 Premium: 8% Base',
    'hero.badge_standard': 'Standard: 5% Base',

    // Daily Rewards
    'daily.checkin_bonus': 'Daily Check-in Bonus',
    'daily.day': 'Day {day}',
    'daily.description': 'Earn free TON every 24h • Total collected: +{total} TON',
    'daily.collect_now': 'Collect Bonus Now',
    'daily.next_in': 'Next in:',
    'daily.congrats': 'Bonus Claimed! +{amount} TON added to your balance.',

    // Search & Filters
    'search.placeholder': 'Search destination, hotel name, or city (e.g., Bali, Paris, Dubai)...',
    'search.all_cities': 'All',
    'search.featured_stays': 'Featured Stays',
    'search.currency_btn': 'Currency: {code}',
    'search.ton_price': '1 TON = ${price}',

    // Smart Travel Suggestions
    'smart.title': 'Smart Travel Suggestions',
    'smart.subtitle': 'Analyzed {count} past stays & DNA to discover high-yield TON cashback gems.',
    'smart.subtitle_empty': 'Analyzed travel preferences to discover high-yield TON cashback gems.',
    'smart.personalize': 'Personalize DNA',
    'smart.refresh': 'Refresh',
    'smart.ai_badge': 'Gemini AI',
    'smart.max_cashback': '{rate}% Max Cashback',
    'smart.styles_label': 'Preferred Travel Styles & Vibes (Select all that apply)',
    'smart.budget_label': 'Target Nightly Budget Tier',
    'smart.pace_label': 'Trip Pace & Atmosphere',
    'smart.perks_label': 'Must-Have Hotel Amenities & Perks',
    'smart.save_btn': 'Save & Generate Smart Suggestions',
    'smart.dna_title': 'Your Travel Persona & Booking DNA',
    'smart.maximizer_title': 'TON Cashback Maximizer',
    'smart.matches_count': '{count} Matches',
    'smart.matches_title': "Personalized 'Hidden Gem' Stays",
    'smart.sorted_by': 'Sorted by TON Cashback Yield & DNA Affinity',
    'smart.why_gemini': 'Why Gemini Matched This Stay',
    'smart.insider_perk': 'Insider Perk:',
    'smart.nightly_rate': 'Nightly rate ({nights} Nights stay)',
    'smart.per_night': '/ night',
    'smart.max_estimated_cashback': 'Max Estimated Cashback',
    'smart.explore_book': 'Explore & Book with TON',

    // Hotel Cards & Modals
    'hotel.per_night': 'per night',
    'hotel.view_deal': 'View Deal & Cashback',
    'hotel.book_now': 'Book with TON',
    'hotel.instant_cashback': 'Earn up to {ton} TON ({percent}%)',
    'hotel.select_room': 'Select Room Option',
    'hotel.room_options': 'Available Rooms & Suites',
    'hotel.guests': 'Guests',
    'hotel.beds': 'Bed Type',
    'hotel.features': 'Room Features',
    'hotel.free_cancel': 'Free cancellation available',
    'hotel.proceed_booking': 'Proceed to Instant Booking',
    'hotel.price_trend': 'Price History & TON Yield Trend',

    // Booking Checkout Modal
    'checkout.title': 'Complete Booking & Earn TON',
    'checkout.guest_info': 'Guest Information',
    'checkout.full_name': 'Full Legal Name',
    'checkout.email': 'Confirmation Email',
    'checkout.checkin': 'Check-In',
    'checkout.checkout': 'Check-Out',
    'checkout.stay_duration': '{nights} Nights • {guests} Guests',
    'checkout.payment_method': 'Select Payment Method',
    'checkout.pay_ton': 'TON Cryptocurrency',
    'checkout.pay_usdt': 'USDT on TON',
    'checkout.pay_card': 'Debit / Credit Card (Stripe)',
    'checkout.cashback_reward': 'Your TON Cashback Reward',
    'checkout.confirm_pay': 'Confirm & Pay {amount}',
    'checkout.processing': 'Confirming on TON Blockchain...',
    'checkout.success_title': 'Booking Confirmed & TON Deposited!',
    'checkout.success_desc': 'Your reservation is secured and +{ton} TON cashback has been added to your wallet balance.',
    'checkout.view_voucher': 'View My Stays Voucher',

    // Wallet & Settings View
    'wallet.title': 'TON Cashback Wallet',
    'wallet.subtitle': 'Telegram TON Space Connected',
    'wallet.available_balance': 'Available Cashback Balance',
    'wallet.withdraw_btn': 'Withdraw {amount} TON to Telegram Wallet',
    'wallet.transferring': 'Transferring TON to Telegram Wallet...',
    'wallet.transferred': 'TON Transferred Successfully!',
    'wallet.fx_calculator': 'FX Calculator',
    'wallet.settings_title': 'Preferences & Settings',
    'wallet.language_setting': 'App Interface Language',
    'wallet.language_desc': 'Switch language between English, Russian, and Spanish across the entire Mini App',
    'wallet.theme_setting': 'Accent Color Theme',
    'wallet.theme_desc': 'Customize the Mini App interface accents, buttons, and navigation colors',
    'wallet.currency_setting': 'Currency & Live FX Rates',
    'wallet.currency_desc': 'Real-time exchange rates powered by Open Exchange Rates API',
    'wallet.premium_title': 'Telegram Premium Tier',
    'wallet.premium_desc': 'Telegram Premium subscribers get 8% cashback in TON on every hotel stay. Everyone else earns 5%.',
    'wallet.premium_btn_disable': 'Switch to Standard (5%)',
    'wallet.premium_btn_enable': 'Enable Premium (8% Back)',
    'wallet.drive_title': 'Google Drive Receipt Backup',
    'wallet.drive_desc': 'Save hotel confirmations & TON cashback receipts automatically',
    'wallet.history_title': 'Cashback Transaction History',
    'wallet.no_history': 'No hotel stays booked yet. Book your first hotel to earn TON cashback!',

    // My Stays View
    'stays.title': 'My Hotel Reservations',
    'stays.subtitle': 'View booking vouchers & exported Google Drive receipts',
    'stays.export_drive': 'Export to Google Drive',
    'stays.exporting': 'Exporting Receipt...',
    'stays.open_drive': 'Open Drive Voucher',
    'stays.status_confirmed': 'Confirmed',
    'stays.no_stays': 'No reservations found. Browse featured hotels to book your first getaway!',

    // Map View
    'map.title': 'Interactive Hotel Map',
    'map.subtitle': 'Explore luxury hotels worldwide with live TON cashback rates',
    'map.filter_city': 'City:',
    'map.view_hotel': 'View Details'
  },
  ru: {
    // Header & Brand
    'app.title': 'TON Travel',
    'app.subtitle': 'Телеграм Мини-Приложение для Путешествий',
    'app.bot': 'бот • 3M+ Отелей',
    'header.rate': '1 TON = ${price}',
    'header.premium_active': 'Премиум (8% Кэшбэк в TON)',
    'header.standard_active': 'Стандарт (5% Кэшбэк)',
    'header.connect_wallet': 'Подключить кошелёк',
    'header.switch_wallet': 'Сменить кошелёк',
    'header.sync_drive': 'Синхр. Drive',
    'header.drive_connected': 'Drive Подключен',
    'header.language': 'Язык',
    'header.theme': 'Тема',
    'header.currency': 'Валюта',

    // Bottom Navigation Tabs
    'tab.hotels': 'Отели',
    'tab.map': 'Карта',
    'tab.wallet': 'Кошелёк',
    'tab.stays': 'Мои брони',

    // Hero Banner
    'hero.badge': 'Мини-Приложение Telegram для Путешествий',
    'hero.title': 'Бронируйте 3М+ отелей по всему миру.\nПолучайте кэшбэк в TON прямо на кошелёк.',
    'hero.description': 'Оплачивайте в TON, USDT на TON или картой. Подписчики Telegram Premium получают кэшбэк {premiumRate}% в TON плюс до +3.5% бонуса программы лояльности!',
    'hero.badge_premium': '👑 Премиум: 8% Базовый',
    'hero.badge_standard': 'Стандарт: 5% Базовый',

    // Daily Rewards
    'daily.checkin_bonus': 'Ежедневный бонус за вход',
    'daily.day': 'День {day}',
    'daily.description': 'Получайте бесплатный TON каждые 24ч • Всего собрано: +{total} TON',
    'daily.collect_now': 'Забрать бонус сейчас',
    'daily.next_in': 'Следующий через:',
    'daily.congrats': 'Бонус получен! +{amount} TON зачислено на ваш баланс.',

    // Search & Filters
    'search.placeholder': 'Поиск направления, отеля или города (например: Бали, Париж, Дубай)...',
    'search.all_cities': 'Все',
    'search.featured_stays': 'Рекомендуемые отели',
    'search.currency_btn': 'Валюта: {code}',
    'search.ton_price': '1 TON = ${price}',

    // Smart Travel Suggestions
    'smart.title': 'Умные рекомендации отелей',
    'smart.subtitle': 'Проанализировано {count} прошлых поездок для подбора лучших отелей с максимальным кэшбэком в TON.',
    'smart.subtitle_empty': 'Анализируем предпочтения для подбора лучших отелей с высоким кэшбэком в TON.',
    'smart.personalize': 'Настроить профиль',
    'smart.refresh': 'Обновить',
    'smart.ai_badge': 'Gemini ИИ',
    'smart.max_cashback': '{rate}% Макс. Кэшбэк',
    'smart.styles_label': 'Любимые стили отдыха и атмосфера (выберите несколько)',
    'smart.budget_label': 'Ценовой диапазон за ночь',
    'smart.pace_label': 'Темп и цель путешествия',
    'smart.perks_label': 'Обязательные удобства и привилегии',
    'smart.save_btn': 'Сохранить и подобрать отели',
    'smart.dna_title': 'Ваш профиль путешественника',
    'smart.maximizer_title': 'Максимизатор кэшбэка в TON',
    'smart.matches_count': '{count} Вариантов',
    'smart.matches_title': "Персональные 'Жемчужины' Отелей",
    'smart.sorted_by': 'Сортировка по доходности TON и соответствию профилю',
    'smart.why_gemini': 'Почему Gemini выбрал этот отель',
    'smart.insider_perk': 'Инсайдерский совет:',
    'smart.nightly_rate': 'Тариф за ночь ({nights} ночей)',
    'smart.per_night': '/ ночь',
    'smart.max_estimated_cashback': 'Максимальный кэшбэк',
    'smart.explore_book': 'Изучить и забронировать в TON',

    // Hotel Cards & Modals
    'hotel.per_night': 'за ночь',
    'hotel.view_deal': 'Смотреть отель и кэшбэк',
    'hotel.book_now': 'Забронировать в TON',
    'hotel.instant_cashback': 'До +{ton} TON ({percent}%)',
    'hotel.select_room': 'Выбрать категорию номера',
    'hotel.room_options': 'Доступные номера и люксы',
    'hotel.guests': 'Гостей',
    'hotel.beds': 'Тип кровати',
    'hotel.features': 'Особенности номера',
    'hotel.free_cancel': 'Бесплатная отмена бронирования',
    'hotel.proceed_booking': 'Перейти к моментальному бронированию',
    'hotel.price_trend': 'История цен и динамика начисления TON',

    // Booking Checkout Modal
    'checkout.title': 'Оформление бронирования и кэшбэк',
    'checkout.guest_info': 'Данные гостя',
    'checkout.full_name': 'Имя и фамилия (как в паспорте)',
    'checkout.email': 'Email для подтверждения',
    'checkout.checkin': 'Заезд',
    'checkout.checkout': 'Выезд',
    'checkout.stay_duration': '{nights} Ночей • {guests} Гостей',
    'checkout.payment_method': 'Способ оплаты',
    'checkout.pay_ton': 'Криптовалюта TON',
    'checkout.pay_usdt': 'USDT на блокчейне TON',
    'checkout.pay_card': 'Банковская карта (Stripe)',
    'checkout.cashback_reward': 'Ваш кэшбэк в TON',
    'checkout.confirm_pay': 'Оплатить {amount}',
    'checkout.processing': 'Подтверждение в блокчейне TON...',
    'checkout.success_title': 'Бронирование подтверждено! TON зачислен!',
    'checkout.success_desc': 'Ваш номер зарезервирован, а кэшбэк +{ton} TON моментально начислен на ваш баланс.',
    'checkout.view_voucher': 'Открыть ваучер поездки',

    // Wallet & Settings View
    'wallet.title': 'TON Кэшбэк Кошелёк',
    'wallet.subtitle': 'Подключен Telegram TON Space',
    'wallet.available_balance': 'Доступный баланс кэшбэка',
    'wallet.withdraw_btn': 'Вывести {amount} TON на Telegram Кошелёк',
    'wallet.transferring': 'Перевод TON на Telegram кошелёк...',
    'wallet.transferred': 'TON успешно переведены!',
    'wallet.fx_calculator': 'FX Калькулятор',
    'wallet.settings_title': 'Настройки и персонализация',
    'wallet.language_setting': 'Язык интерфейса приложения',
    'wallet.language_desc': 'Переключение языка между английским, русским и испанским для всего приложения',
    'wallet.theme_setting': 'Цветовая тема акцентов',
    'wallet.theme_desc': 'Настройка цветов кнопок, иконок и навигационной панели',
    'wallet.currency_setting': 'Валюта и актуальные курсы FX',
    'wallet.currency_desc': 'Курсы валют в реальном времени от Open Exchange Rates',
    'wallet.premium_title': 'Статус Telegram Premium',
    'wallet.premium_desc': 'Пользователи Telegram Premium получают повышенный кэшбэк 8% в TON за каждое бронирование (стандартный тариф: 5%).',
    'wallet.premium_btn_disable': 'Переключить на Стандарт (5%)',
    'wallet.premium_btn_enable': 'Включить Премиум (8% Кэшбэк)',
    'wallet.drive_title': 'Резервная копия ваучеров в Google Drive',
    'wallet.drive_desc': 'Автоматическое сохранение квитанций и ваучеров отелей',
    'wallet.history_title': 'История начислений кэшбэка',
    'wallet.no_history': 'У вас пока нет завершенных бронирований. Забронируйте первый отель для получения кэшбэка в TON!',

    // My Stays View
    'stays.title': 'Мои бронирования отелей',
    'stays.subtitle': 'Ваучеры бронирований и сохраненные квитанции в Google Drive',
    'stays.export_drive': 'Сохранить в Google Drive',
    'stays.exporting': 'Экспорт квитанции...',
    'stays.open_drive': 'Открыть ваучер в Drive',
    'stays.status_confirmed': 'Подтверждено',
    'stays.no_stays': 'Бронирований пока нет. Выберите отель из каталога, чтобы отправиться в поездку!',

    // Map View
    'map.title': 'Интерактивная карта отелей',
    'map.subtitle': 'Исследуйте лучшие отели мира с актуальными ставками кэшбэка в TON',
    'map.filter_city': 'Город:',
    'map.view_hotel': 'Смотреть отель'
  },
  es: {
    // Header & Brand
    'app.title': 'TON Travel',
    'app.subtitle': 'Mini App de Viajes de Telegram',
    'app.bot': 'bot • 3M+ Hoteles',
    'header.rate': '1 TON = ${price}',
    'header.premium_active': 'Premium (8% Cashback TON)',
    'header.standard_active': 'Estándar (5% Cashback)',
    'header.connect_wallet': 'Conectar Billetera',
    'header.switch_wallet': 'Cambiar Billetera',
    'header.sync_drive': 'Sincronizar Drive',
    'header.drive_connected': 'Drive Conectado',
    'header.language': 'Idioma',
    'header.theme': 'Tema',
    'header.currency': 'Moneda',

    // Bottom Navigation Tabs
    'tab.hotels': 'Hoteles',
    'tab.map': 'Explorar Mapa',
    'tab.wallet': 'Billetera',
    'tab.stays': 'Mis Estancias',

    // Hero Banner
    'hero.badge': 'Mini App de Viajes de Telegram',
    'hero.title': 'Reserva 3M+ Hoteles en Todo el Mundo.\nGana Recompensas en TON Directas a tu Billetera.',
    'hero.description': 'Paga con TON, USDT en TON o tarjeta. ¡Los miembros de Telegram Premium ganan {premiumRate}% de cashback en TON más hasta +3.5% de bono de Viajero Frecuente!',
    'hero.badge_premium': '👑 Premium: 8% Base',
    'hero.badge_standard': 'Estándar: 5% Base',

    // Daily Rewards
    'daily.checkin_bonus': 'Bono Diario de Registro',
    'daily.day': 'Día {day}',
    'daily.description': 'Gana TON gratis cada 24h • Total recolectado: +{total} TON',
    'daily.collect_now': 'Reclamar Bono Ahora',
    'daily.next_in': 'Próximo en:',
    'daily.congrats': '¡Bono Reclamado! Se han añadido +{amount} TON a tu saldo.',

    // Search & Filters
    'search.placeholder': 'Buscar destino, hotel o ciudad (ej. Bali, París, Dubái)...',
    'search.all_cities': 'Todos',
    'search.featured_stays': 'Estancias Destacadas',
    'search.currency_btn': 'Moneda: {code}',
    'search.ton_price': '1 TON = ${price}',

    // Smart Travel Suggestions
    'smart.title': 'Sugerencias de Viaje Inteligentes',
    'smart.subtitle': 'Analizamos {count} estancias previas y perfil para descubrir joyas con el mayor cashback en TON.',
    'smart.subtitle_empty': 'Analizamos tus preferencias para descubrir joyas con el mayor cashback en TON.',
    'smart.personalize': 'Personalizar Perfil',
    'smart.refresh': 'Actualizar',
    'smart.ai_badge': 'IA Gemini',
    'smart.max_cashback': '{rate}% Cashback Máx.',
    'smart.styles_label': 'Estilos de viaje y ambiente preferidos (selecciona todos los aplicables)',
    'smart.budget_label': 'Nivel de presupuesto por noche',
    'smart.pace_label': 'Ritmo y propósito del viaje',
    'smart.perks_label': 'Comodidades y beneficios indispensables',
    'smart.save_btn': 'Guardar y Generar Sugerencias',
    'smart.dna_title': 'Tu Perfil y ADN de Viajero',
    'smart.maximizer_title': 'Optimizador de Cashback en TON',
    'smart.matches_count': '{count} Coincidencias',
    'smart.matches_title': "Joyas Ocultas Personalizadas",
    'smart.sorted_by': 'Ordenado por rendimiento de TON y afinidad con tu perfil',
    'smart.why_gemini': 'Por qué Gemini recomienda este hotel',
    'smart.insider_perk': 'Consejo secreto:',
    'smart.nightly_rate': 'Tarifa por noche ({nights} noches de estancia)',
    'smart.per_night': '/ noche',
    'smart.max_estimated_cashback': 'Cashback Máximo Estimado',
    'smart.explore_book': 'Explorar y Reservar con TON',

    // Hotel Cards & Modals
    'hotel.per_night': 'por noche',
    'hotel.view_deal': 'Ver Oferta y Cashback',
    'hotel.book_now': 'Reservar con TON',
    'hotel.instant_cashback': 'Gana hasta +{ton} TON ({percent}%)',
    'hotel.select_room': 'Seleccionar Habitación',
    'hotel.room_options': 'Habitaciones y Suites Disponibles',
    'hotel.guests': 'Huéspedes',
    'hotel.beds': 'Tipo de Cama',
    'hotel.features': 'Comodidades de la Habitación',
    'hotel.free_cancel': 'Cancelación gratuita disponible',
    'hotel.proceed_booking': 'Continuar con la Reserva Inmediata',
    'hotel.price_trend': 'Historial de Precios y Tendencia de TON',

    // Booking Checkout Modal
    'checkout.title': 'Completar Reserva y Ganar TON',
    'checkout.guest_info': 'Información del Huésped',
    'checkout.full_name': 'Nombre Completo Legal',
    'checkout.email': 'Correo Electrónico de Confirmación',
    'checkout.checkin': 'Entrada (Check-in)',
    'checkout.checkout': 'Salida (Check-out)',
    'checkout.stay_duration': '{nights} Noches • {guests} Huéspedes',
    'checkout.payment_method': 'Método de Pago',
    'checkout.pay_ton': 'Criptomoneda TON',
    'checkout.pay_usdt': 'USDT en TON',
    'checkout.pay_card': 'Tarjeta de Débito / Crédito (Stripe)',
    'checkout.cashback_reward': 'Tu Recompensa de Cashback en TON',
    'checkout.confirm_pay': 'Confirmar y Pagar {amount}',
    'checkout.processing': 'Confirmando en la Blockchain de TON...',
    'checkout.success_title': '¡Reserva Confirmada y TON Depositado!',
    'checkout.success_desc': 'Tu estancia está asegurada y se han añadido +{ton} TON a tu saldo de billetera.',
    'checkout.view_voucher': 'Ver Cupón de Mis Estancias',

    // Wallet & Settings View
    'wallet.title': 'Billetera de Cashback en TON',
    'wallet.subtitle': 'Conectado a Telegram TON Space',
    'wallet.available_balance': 'Saldo Disponible de Cashback',
    'wallet.withdraw_btn': 'Retirar {amount} TON a la Billetera de Telegram',
    'wallet.transferring': 'Transfiriendo TON a Telegram...',
    'wallet.transferred': '¡TON Transferido con Éxito!',
    'wallet.fx_calculator': 'Calculadora FX',
    'wallet.settings_title': 'Preferencias y Ajustes',
    'wallet.language_setting': 'Idioma de la Aplicación',
    'wallet.language_desc': 'Cambia el idioma entre Inglés, Ruso y Español en toda la Mini App',
    'wallet.theme_setting': 'Tema de Color de Acentos',
    'wallet.theme_desc': 'Personaliza los colores de botones, acentos y navegación',
    'wallet.currency_setting': 'Moneda y Tipos de Cambio en Vivo',
    'wallet.currency_desc': 'Tipos de cambio en tiempo real mediante Open Exchange Rates API',
    'wallet.premium_title': 'Nivel Telegram Premium',
    'wallet.premium_desc': 'Los suscriptores de Telegram Premium obtienen un 8% de cashback en TON en cada estancia (estándar: 5%).',
    'wallet.premium_btn_disable': 'Cambiar a Estándar (5%)',
    'wallet.premium_btn_enable': 'Activar Premium (8% Cashback)',
    'wallet.drive_title': 'Copia de Recibos en Google Drive',
    'wallet.drive_desc': 'Guarda confirmaciones de hotel y recibos de cashback automáticamente',
    'wallet.history_title': 'Historial de Transacciones de Cashback',
    'wallet.no_history': 'Aún no tienes estancias reservadas. ¡Reserva tu primer hotel para ganar cashback en TON!',

    // My Stays View
    'stays.title': 'Mis Reservas de Hotel',
    'stays.subtitle': 'Consulta cupones de reserva y comprobantes exportados a Google Drive',
    'stays.export_drive': 'Exportar a Google Drive',
    'stays.exporting': 'Exportando Recibo...',
    'stays.open_drive': 'Abrir Cupón en Drive',
    'stays.status_confirmed': 'Confirmado',
    'stays.no_stays': 'No se encontraron reservas. ¡Explora los hoteles destacados para tu próxima escapada!',

    // Map View
    'map.title': 'Mapa Interactivo de Hoteles',
    'map.subtitle': 'Explora hoteles de lujo en todo el mundo con tasas de cashback en TON en vivo',
    'map.filter_city': 'Ciudad:',
    'map.view_hotel': 'Ver Detalles'
  }
};

export function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const langDict = translations[lang] || translations.en;
  let text = (langDict as Record<string, string>)[key] || (translations.en as Record<string, string>)[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
    });
  }

  return text;
}

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languageInfo: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  languageInfo: LANGUAGES.en
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => loadSavedLanguage());

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    saveLanguage(newLang);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(language, key, params);
  };

  const languageInfo = LANGUAGES[language] || LANGUAGES.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageInfo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  return useContext(LanguageContext);
}
