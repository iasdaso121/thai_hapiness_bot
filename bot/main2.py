import os
import logging
from collections import defaultdict
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    KeyboardButton
)
from telegram.ext import (
    Application, 
    CommandHandler, 
    CallbackQueryHandler, 
    ContextTypes,
    MessageHandler,
    filters
)
import aiohttp
from datetime import datetime

NODE_API_URL = os.getenv('NODE_API_URL', 'http://server:5050/api')
BOT_TOKEN = os.getenv('BOT_TOKEN')
CRYPTO_BOT_TOKEN = os.getenv('CRYPTO_BOT_TOKEN')
CRYPTO_PAYMENT_ASSET = os.getenv('CRYPTO_PAYMENT_ASSET', 'USDT')
NGROK_API_URL = os.getenv('NGROK_API_URL', 'http://127.0.0.1:4040/api/tunnels')
PUBLIC_BASE_URL = os.getenv('PUBLIC_BASE_URL')

# логи
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

user_wallets = defaultdict(lambda: {
    'balance': 0.0,
    'invoices': {},
})


async def get_public_base_url():
    """Получить публичный URL (ngrok или указанный через переменные окружения)."""
    global PUBLIC_BASE_URL

    if PUBLIC_BASE_URL:
        return PUBLIC_BASE_URL.rstrip('/')

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(NGROK_API_URL) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for tunnel in data.get('tunnels', []):
                        public_url = tunnel.get('public_url')
                        if public_url:
                            PUBLIC_BASE_URL = public_url.rstrip('/')
                            return PUBLIC_BASE_URL
    except Exception as e:
        logger.error(f"Error resolving ngrok url: {e}")

    fallback_url = NODE_API_URL.split('/api')[0] if '/api' in NODE_API_URL else NODE_API_URL
    PUBLIC_BASE_URL = fallback_url.rstrip('/')
    return PUBLIC_BASE_URL


async def build_public_media_url(path: str) -> str:
    base_url = await get_public_base_url()
    return f"{base_url}/{path.lstrip('/')}"

class BotAPI:
    def __init__(self, base_url):
        self.base_url = base_url
    
    async def get_bot_content(self, content_key):
        """Получить контент для бота"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/bot/content/{content_key}') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting content {content_key}: {e}")
            return None
    
    async def get_catalog_categories(self):
        """Получить категории товаров"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/catalog/categories') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return []
        except Exception as e:
            logger.error(f"Error getting categories: {e}")
            return []
    
    async def get_products_by_category(self, category_id, city_id=None, district_id=None, page=1, limit=7):
        """Получить товары по категории с пагинацией"""
        try:
            params = {'page': page, 'limit': limit}
            if city_id: params['cityId'] = city_id
            if district_id: params['districtId'] = district_id
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/catalog/categories/{category_id}/products', params=params) as resp:
                    if resp.status == 200:
                        products = await resp.json()
                        if isinstance(products, dict) and 'rows' in products:
                            return products['rows'], products.get('count', 0)
                        return products, len(products)
                    return [], 0
        except Exception as e:
            logger.error(f"Error getting products for category {category_id}: {e}")
            return [], 0
    
    async def get_positions_by_product(self, product_id, city_id=None, district_id=None):
        """Получить позиции по продукту"""
        try:
            params = {}
            if city_id: params['cityId'] = city_id
            if district_id: params['districtId'] = district_id
            
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/catalog/products/{product_id}/positions', params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get('rows', data) if isinstance(data, dict) else data
                    return []
        except Exception as e:
            logger.error(f"Error getting positions for product {product_id}: {e}")
            return []
    
    async def get_cities_with_districts(self):
        """Получить города с районами"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/bot/cities-with-districts') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return []
        except Exception as e:
            logger.error(f"Error getting cities: {e}")
            return []

    async def get_available_districts(self, category_id, city_id):
        """Получить доступные районы для категории"""
        try:
            params = {'cityId': city_id}
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/categories/{category_id}/districts', params=params) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return []
        except Exception as e:
            logger.error(f"Error getting available districts: {e}")
            return []
    
    async def get_product_by_id(self, product_id):
        """Получить информацию о продукте по ID"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/product/{product_id}') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting product {product_id}: {e}")
            return None
    
    async def get_position_by_id(self, position_id):
        """Получить информацию о позиции по ID"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/position/{position_id}') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting position {position_id}: {e}")
            return None
        
    async def get_or_create_client(self, telegram_id, username=None, first_name=None, last_name=None):
        """Получить или создать клиента"""
        try:
            data = {
                'username': username,
                'firstName': first_name,
                'lastName': last_name
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(f'{self.base_url}/bot/clients/{telegram_id}', json=data) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting/creating client: {e}")
            return None
    
    async def add_purchase(self, telegram_id, position_id, position_name=None, price=None, product_name=None):
        """Добавить покупку клиенту"""
        try:
            data = {
                'positionId': position_id,
                'positionName': position_name,
                'price': price,
                'productName': product_name
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(f'{self.base_url}/bot/clients/{telegram_id}/purchase', json=data) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error adding purchase: {e}")
            return None
    
    async def get_client_purchases(self, telegram_id):
        """Получить покупки клиента"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/bot/clients/{telegram_id}/purchases') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting client purchases: {e}")
            return None

    async def get_client_balance(self, telegram_id):
        """Получить баланс клиента"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/bot/clients/{telegram_id}/balance') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting client balance: {e}")
            return None

    async def adjust_balance(self, telegram_id, amount):
        """Изменить баланс клиента"""
        try:
            payload = {'amount': amount}
            async with aiohttp.ClientSession() as session:
                async with session.post(f'{self.base_url}/bot/clients/{telegram_id}/balance/adjust', json=payload) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    logger.error(f"Adjust balance failed with status {resp.status}")
                    return None
        except Exception as e:
            logger.error(f"Error adjusting client balance: {e}")
            return None

    async def get_reviews_stats(self):
        """Получить статистику отзывов"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/review/stats') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting review stats: {e}")
            return None

    async def get_reviews(self):
        """Получить список отзывов"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/review') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return []
        except Exception as e:
            logger.error(f"Error getting reviews: {e}")
            return []

api = BotAPI(NODE_API_URL)


class CryptoBotAPI:
    def __init__(self, token):
        self.base_url = 'https://pay.crypt.bot/api'
        self.token = token

    async def _post(self, endpoint, payload=None):
        if not self.token:
            logger.warning("Crypto Bot token is not configured")
            return None

        headers = {
            'Content-Type': 'application/json',
            'Crypto-Pay-API-Token': self.token
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/{endpoint}", json=payload or {}, headers=headers) as resp:
                    data = await resp.json()
                    if data.get('ok'):
                        return data.get('result')
                    logger.error(f"Crypto Bot API error ({endpoint}): {data}")
        except Exception as e:
            logger.error(f"Error calling Crypto Bot API {endpoint}: {e}")
        return None

    async def get_balance(self):
        return await self._post('getBalance')

    async def create_invoice(self, asset, amount, description=None, payload=None):
        body = {
            'asset': asset,
            'amount': amount,
        }
        if description:
            body['description'] = description
        if payload:
            body['payload'] = payload
        return await self._post('createInvoice', body)

    async def get_invoice(self, invoice_id):
        result = await self._post('getInvoices', {'invoice_ids': [invoice_id]})
        if result and result.get('items'):
            return result['items'][0]
        return None


crypto_bot = CryptoBotAPI(CRYPTO_BOT_TOKEN)

MAIN_MENU = ReplyKeyboardMarkup([
    [KeyboardButton("👤 Профиль"), KeyboardButton("Каталог"), KeyboardButton("🏙️ Город")],
    [KeyboardButton("📦 Заказы"), KeyboardButton("ℹ️ О нас"), KeyboardButton("❓ Помощь")],
    [KeyboardButton("💳 Баланс"), KeyboardButton("⭐ Отзывы")]
], resize_keyboard=True)

# Состояния пользователей
user_states = {}


def get_user_wallet(user_id):
    return user_wallets[user_id]


def get_user_state(user_id):
    """Получить состояние пользователя или инициализировать дефолтное."""
    return user_states.setdefault(user_id, {
        'city_id': None,
        'district_id': None,
        'current_category': None,
        'current_product': None,
        'current_page': 1,
        'awaiting_topup': None
    })


def format_amount(value):
    return f"{float(value):.2f}"


async def sync_wallet_balance(user_id):
    """Синхронизировать локальный кошелек с сервером"""
    wallet = get_user_wallet(user_id)
    try:
        balance_data = await api.get_client_balance(user_id)
        if balance_data and 'balance' in balance_data:
            wallet['balance'] = float(balance_data['balance'])
    except Exception as e:
        logger.error(f"Failed to sync balance for {user_id}: {e}")
    return wallet

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    logger.info(f"User {user.id} started the bot")

    get_user_wallet(user.id)
    await sync_wallet_balance(user.id)
    
    user_state = get_user_state(user.id)
    
    # Check if city/district selected
    city_id = user_state.get('city_id')
    district_id = user_state.get('district_id')
    
    welcome_content = await api.get_bot_content('welcome')
    review_stats = await api.get_reviews_stats()
    
    stats_text = ""
    if review_stats and review_stats.get('count', 0) > 0:
        stats_text = f"\n\n⭐ <b>Рейтинг магазина: {review_stats.get('average')}</b> ({review_stats.get('count')} отзывов)"

    text = welcome_content.get('text', 'welcome') if welcome_content else 'welcome'
    text += stats_text
    
    # If location not selected, don't show main menu, show city selection immediately
    if not city_id:
        if welcome_content and welcome_content.get('image'):
            image_url = await build_public_media_url(welcome_content['image'])
            try:
                await update.message.reply_photo(
                    photo=image_url,
                    caption=text,
                    parse_mode='HTML'
                )
            except Exception as e:
                logger.error(f"Error sending welcome photo: {e}")
        else:
            await update.message.reply_text(
                text,
                parse_mode='HTML'
            )
        
        await show_city_selection(update, context, from_menu=True)
        return

    if welcome_content and welcome_content.get('image'):
        image_url = await build_public_media_url(welcome_content['image'])
        try:
            await update.message.reply_photo(
                photo=image_url,
                caption=text,
                parse_mode='HTML',
                reply_markup=MAIN_MENU
            )
            return
        except Exception as e:
            logger.error(f"Error sending welcome photo: {e}")
    
    await update.message.reply_text(
        text,
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )

async def handle_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик нижнего меню"""
    text = update.message.text
    user_id = update.effective_user.id
    user_state = get_user_state(user_id)
    
    # Enforce location selection check for main menu interaction
    city_id = user_state.get('city_id')
    
    if not city_id:
        # Check if text is a valid location selection or other allowed command if any
        # Here we just re-force city selection if they try to access menu
        await show_city_selection(update, context, from_menu=True)
        return

    # Ожидание ввода суммы для пополнения
    awaiting_topup = user_state.get('awaiting_topup')
    if awaiting_topup:
        normalized_text = text.replace(",", ".").strip()
        if normalized_text.lower() in ("отмена", "cancel", "назад"):
            user_state['awaiting_topup'] = None
            await update.message.reply_text(
                "Пополнение отменено.",
                reply_markup=MAIN_MENU
            )
            return
        try:
            amount = float(normalized_text)
        except ValueError:
            await update.message.reply_text(
                "Введите сумму числом, например 12.5",
                reply_markup=MAIN_MENU
            )
            return

        if amount <= 0:
            await update.message.reply_text(
                "Сумма должна быть больше нуля. Повторите ввод или отправьте «Отмена».",
                reply_markup=MAIN_MENU
            )
            return

        user_state['awaiting_topup'] = None
        await create_topup_invoice(update, awaiting_topup.get('asset', CRYPTO_PAYMENT_ASSET), amount)
        return
    
    if text == "Каталог":
        await show_categories(update, context)
    elif text == "🏙️ Город":
        await show_city_selection_menu(update, context)
    elif text == "📦 Заказы":
        await show_orders(update, context)
    elif text == "👤 Профиль":
        await show_profile(update, context)
    elif text == "ℹ️ О нас":
        await show_about_menu(update, context)
    elif text == "❓ Помощь":
        await show_help_menu(update, context)
    elif text == "💳 Баланс":
        await show_balance_menu(update, context)
    elif text == "⭐ Отзывы":
        await show_reviews_menu(update, context)


async def show_reviews_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать меню отзывов"""
    reviews = await api.get_reviews()
    stats = await api.get_reviews_stats()
    
    if not reviews:
        await update.message.reply_text(
            "😔 <b>Отзывов пока нет</b>",
            parse_mode='HTML',
            reply_markup=MAIN_MENU
        )
        return

    text = f"⭐ <b>Отзывы наших клиентов</b>\n"
    if stats:
        text += f"Рейтинг: <b>{stats.get('average')}</b> ({stats.get('count')} отзывов)\n\n"
    
    # Show last 10 reviews
    last_reviews = reviews[-10:]
    for r in last_reviews:
        rating_stars = "⭐" * r.get('rating', 5)
        text += f"👤 <b>{r.get('author')}</b> {rating_stars}\n{r.get('text')}\n\n"
        
    await update.message.reply_text(
        text,
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )


async def show_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать профиль пользователя"""
    user = update.effective_user
    user_id = user.id

    client_data = await api.get_client_purchases(user_id)
    
    if not client_data:
        client = await api.get_or_create_client(
            user_id,
            user.username,
            user.first_name,
            user.last_name
        )
        purchases_count = 0
        username = user.username or user.first_name or "Не указан"
    else:
        purchases_count = client_data.get('total', 0)
        client_info = client_data.get('client', {})
        username = client_info.get('username') or user.username or user.first_name or "Не указан"
    
    user_state = user_states.get(user_id, {})
    location_info = await get_location_button_text(user_state)

    wallet = await sync_wallet_balance(user_id)

    profile_text = (
        f"👤 <b>Профиль</b>\n\n"
        f"🆔 ID: {user_id}\n"
        f"📛 Ник: @{username}\n"
        f"Завершенных покупок: <b>{purchases_count}</b>\n\n"
        f"Баланс: <b>{format_amount(wallet['balance'])} {CRYPTO_PAYMENT_ASSET}</b>\n"
        f"Ваш город - {location_info}"
    )
    
    await update.message.reply_text(
        profile_text,
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )


async def show_balance_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать баланс и варианты пополнения."""
    user = update.effective_user if update.message else update.callback_query.from_user
    wallet = await sync_wallet_balance(user.id)

    text = (
        f"💳 <b>Ваш баланс</b>\n\n"
        f"Доступно: <b>{format_amount(wallet['balance'])} {CRYPTO_PAYMENT_ASSET}</b>\n"
        f"Выберите сумму пополнения, укажите свою или проверьте оплату активных инвойсов."
    )

    buttons = [
        [
            InlineKeyboardButton(f"Пополнить 10 {CRYPTO_PAYMENT_ASSET}", callback_data=f"topup_{CRYPTO_PAYMENT_ASSET}_10"),
            InlineKeyboardButton(f"Пополнить 25 {CRYPTO_PAYMENT_ASSET}", callback_data=f"topup_{CRYPTO_PAYMENT_ASSET}_25"),
        ],
        [
            InlineKeyboardButton(f"Пополнить 50 {CRYPTO_PAYMENT_ASSET}", callback_data=f"topup_{CRYPTO_PAYMENT_ASSET}_50"),
            InlineKeyboardButton("Другая сумма", callback_data=f"topup_custom_{CRYPTO_PAYMENT_ASSET}")
        ]
    ]

    pending_buttons = []
    for invoice_id, data in wallet['invoices'].items():
        if data.get('status') != 'paid':
            pending_buttons.append(
                [InlineKeyboardButton(f"Проверить оплату #{invoice_id}", callback_data=f"check_{invoice_id}")]
            )

    reply_markup = InlineKeyboardMarkup(buttons + pending_buttons) if (pending_buttons or buttons) else MAIN_MENU

    if update.message:
        await update.message.reply_text(text, parse_mode='HTML', reply_markup=reply_markup)
    else:
        await update.callback_query.edit_message_text(text, parse_mode='HTML', reply_markup=reply_markup)


async def create_topup_invoice(update: Update, asset: str, amount: float):
    user = update.effective_user if update.message else update.callback_query.from_user
    invoice = await crypto_bot.create_invoice(asset, amount, description="Пополнение баланса", payload=str(user.id))

    if not invoice:
        message = (
            "❌ <b>Не удалось создать инвойс</b>\n"
            "Проверьте CRYPTO_BOT_TOKEN и повторите попытку."
        )
        markup = InlineKeyboardMarkup([[InlineKeyboardButton("Вернуться к балансу", callback_data="balance_menu")]])
        if update.message:
            await update.message.reply_text(message, parse_mode='HTML', reply_markup=MAIN_MENU)
        else:
            await update.callback_query.edit_message_text(message, parse_mode='HTML', reply_markup=markup)
        return

    wallet = await sync_wallet_balance(user.id)
    wallet['invoices'][invoice['invoice_id']] = {
        'amount': amount,
        'asset': asset,
        'status': invoice.get('status', 'active')
    }

    buttons = [[InlineKeyboardButton("Оплатить через Crypto Bot", url=invoice.get('pay_url'))]]
    buttons.append([InlineKeyboardButton("🔄 Проверить оплату", callback_data=f"check_{invoice['invoice_id']}")])

    text = (
        f"✅ Инвойс создан!\n"
        f"Сумма: <b>{format_amount(amount)} {asset}</b>\n"
        f"Invoice ID: <code>{invoice['invoice_id']}</code>"
    )

    if update.message:
        await update.message.reply_text(text, parse_mode='HTML', reply_markup=InlineKeyboardMarkup(buttons))
    else:
        await update.callback_query.edit_message_text(text, parse_mode='HTML', reply_markup=InlineKeyboardMarkup(buttons))


async def prompt_custom_topup(update: Update, asset: str):
    """Запросить у пользователя произвольную сумму пополнения."""
    user = update.effective_user if update.message else update.callback_query.from_user
    user_state = get_user_state(user.id)
    user_state['awaiting_topup'] = {'asset': asset}

    message = (
        f"Введите сумму пополнения в {asset}.\n"
        f"Пример: 12.5\n"
        f"Для отмены отправьте «Отмена»."
    )

    if update.message:
        await update.message.reply_text(message, reply_markup=MAIN_MENU)
    else:
        await update.callback_query.message.reply_text(message, reply_markup=MAIN_MENU)


async def check_invoice_status(update: Update, invoice_id: str):
    user = update.effective_user if update.message else update.callback_query.from_user
    invoice = await crypto_bot.get_invoice(invoice_id)

    if not invoice:
        message = "❌ Не удалось получить информацию об оплате. Попробуйте позже."
        if update.message:
            await update.message.reply_text(message, reply_markup=MAIN_MENU)
        else:
            await update.callback_query.edit_message_text(message, reply_markup=MAIN_MENU)
        return

    wallet = await sync_wallet_balance(user.id)
    stored_invoice = wallet['invoices'].get(int(invoice_id))

    if invoice.get('status') == 'paid' and stored_invoice and stored_invoice.get('status') != 'paid':
        wallet['balance'] += float(stored_invoice.get('amount', 0))
        stored_invoice['status'] = 'paid'

        balance_response = await api.adjust_balance(user.id, float(stored_invoice.get('amount', 0)))
        if not balance_response:
            logger.error(f"Failed to persist balance top-up for {user.id}")
        else:
            wallet['balance'] = float(balance_response.get('balance', wallet['balance']))

        message = (
            f"✅ Оплата подтверждена!\n"
            f"Баланс пополнен на <b>{format_amount(stored_invoice.get('amount', 0))} {stored_invoice.get('asset')}</b>.\n"
            f"Текущий баланс: <b>{format_amount(wallet['balance'])} {stored_invoice.get('asset')}</b>"
        )
    else:
        message = (
            f"Инвойс #{invoice_id} имеет статус: <b>{invoice.get('status')}</b>.\n"
            "Нажмите «Проверить оплату» после завершения платежа."
        )

    buttons = [[InlineKeyboardButton("Вернуться к балансу", callback_data="balance_menu")]]

    if update.message:
        await update.message.reply_text(message, parse_mode='HTML', reply_markup=InlineKeyboardMarkup(buttons))
    else:
        await update.callback_query.edit_message_text(message, parse_mode='HTML', reply_markup=InlineKeyboardMarkup(buttons))

async def show_orders(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать список заказов (покупок) пользователя"""
    user = update.effective_user
    user_id = user.id
    
    purchases_data = await api.get_client_purchases(user_id)
    
    if not purchases_data or not purchases_data.get('purchases'):
        if not purchases_data:
            await api.get_or_create_client(
                user_id,
                user.username,
                user.first_name,
                user.last_name
            )
        
        await update.message.reply_text(
            "📦 <b>Ваши заказы</b>\n\n"
            "У вас пока нет завершенных заказов.\n\n",
            parse_mode='HTML',
            reply_markup=MAIN_MENU
        )
        return
    
    purchases = purchases_data['purchases']
    
    purchases_by_date = {}
    for purchase in purchases:
        purchase_date = purchase.get('purchaseDate', '')[:10]
        if purchase_date not in purchases_by_date:
            purchases_by_date[purchase_date] = []
        purchases_by_date[purchase_date].append(purchase)
    
    message_text = "📦 <b>Ваши заказы:</b>\n\n"
    
    sorted_dates = sorted(purchases_by_date.keys(), reverse=True)
    
    total_orders = 0
    total_amount = 0
    
    for date in sorted_dates:
        message_text += f"📅 <b>{date}</b>\n"
        
        for purchase in purchases_by_date[date]:
            product_name = purchase.get('productName', 'Неизвестный товар')
            position_name = purchase.get('positionName', 'Неизвестная позиция')
            price = purchase.get('price', 0)
            
            message_text += (
                f" 🌲 <b>{position_name}</b>\n"
                f"  ({product_name})\n"
                f"  💰 {price} $\n"
            )
            
            position_id = purchase.get('positionId')
            if position_id:
                position_details = await api.get_position_by_id(position_id)
                if position_details:
                    city = position_details.get('city', {})
                    district = position_details.get('district', {})
                    
                    if city:
                        message_text += f"  🏙️ {city.get('name', '')}"
                        if district:
                            message_text += f", {district.get('name', '')}"
                        message_text += "\n"
            
            message_text += "\n"
            
            total_orders += 1
            total_amount += price
        
        message_text += "\n"
    
    # итоговая информация, не факт что нужно
    # message_text += (
    #     f"<b>Итого:</b>\n"
    #     f"📊 Всего заказов: <b>{total_orders}</b>\n"
    #     f"💰 Общая сумма: <b>{total_amount} $</b>"
    # )
    
    if len(purchases) > 20:
        message_text = "📦 <b>Ваши заказы:</b>\n\n"
        # message_text += f"Показаны последние 20 из {len(purchases)} заказов\n\n"
        
        recent_purchases = purchases[-20:]
        for i, purchase in enumerate(recent_purchases, 1):
            product_name = purchase.get('productName', 'Неизвестный товар')
            position_name = purchase.get('positionName', 'Неизвестная позиция')
            price = purchase.get('price', 0)
            date = purchase.get('purchaseDate', '')[:10]
            
            message_text += (
                f"{i}. <b>{product_name}</b>\n"
                f"   📍 {position_name} | 💰 {price} $ | 📅 {date}\n\n"
            )
        
        message_text += f"<i>Всего заказов: {len(purchases)}</i>"
    
    await update.message.reply_text(
        message_text,
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )

async def show_categories(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать категории"""
    categories = await api.get_catalog_categories()
    
    if not categories:
        await update.message.reply_text(
            "<b>Категории временно недоступны</b>",
            parse_mode='HTML',
            reply_markup=MAIN_MENU
        )
        return
    
    keyboard = []
    for category in categories:
        products_count = category.get('productsCount', 0)
        keyboard.append([InlineKeyboardButton(
            f"{category['name']} ({products_count})", 
            callback_data=f"cat_{category['id']}"
        )])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "<b>Выберите категорию:</b>",
        parse_mode='HTML',
        reply_markup=reply_markup
    )

async def get_location_button_text(user_state):
    """Получить текст для кнопки локации в зависимости от выбранного фильтра"""
    city_id = user_state.get('city_id')
    district_id = user_state.get('district_id')
    
    if not city_id:
        return "🏙️ Город не выбран"
    
    cities = await api.get_cities_with_districts()
    city = next((c for c in cities if c['id'] == int(city_id)), None) if cities else None
    
    if not city:
        return "🏙️ Город не выбран"
    
    if not district_id:
        return f"🏙️ {city['name']}"
    
    district = next((d for d in city.get('districts', []) if d['id'] == int(district_id)), None)
    if district:
        return f"🏙️ {city['name']}, {district['name']}"
    else:
        return f"🏙️ {city['name']}"
    
async def show_products(update: Update, context: ContextTypes.DEFAULT_TYPE, category_id, page=1):
    """Показать товары категории с пагинацией"""
    if hasattr(update, 'callback_query'):
        query = update.callback_query
        user_id = query.from_user.id
        message_edit = True
    else:
        user_id = update.effective_user.id
        message_edit = False
    
    user_state = user_states.get(user_id, {})
    
    products, total_count = await api.get_products_by_category(
        category_id, 
        user_state.get('city_id'), 
        None, # ignore district for product list
        page
    )
    
    if not products:
        # Smart suggestion for districts
        city_id = user_state.get('city_id')
        suggested_districts = []
        if city_id:
             suggested_districts = await api.get_available_districts(category_id, city_id)
        
        if suggested_districts:
            district_buttons = []
            for d in suggested_districts:
                # Filter out current district if selected (though if it was selected and had empty products, it's valid to not show it, but current logic implies we are here because current view is empty)
                # Actually, if we are here, current district selection yielded no results.
                # So we show others.
                if str(d['id']) != str(user_state.get('district_id')):
                    district_buttons.append([InlineKeyboardButton(
                        f"📍 {d['name']}",
                        callback_data=f"switch_district_{category_id}_{city_id}_{d['id']}"
                    )])
            
            if district_buttons:
                district_buttons.append([InlineKeyboardButton("🔙 К категориям", callback_data="back_to_categories")])
                
                if message_edit:
                    await query.edit_message_text(
                        f"😔 <b>В вашей локации нет товаров этой категории.</b>\n\n"
                        f"Попробуйте выбрать другой район, где товары есть:",
                        parse_mode='HTML',
                        reply_markup=InlineKeyboardMarkup(district_buttons)
                    )
                else:
                    await update.message.reply_text(
                        f"😔 <b>В вашей локации нет товаров этой категории.</b>\n\n"
                        f"Попробуйте выбрать другой район, где товары есть:",
                        parse_mode='HTML',
                        reply_markup=InlineKeyboardMarkup(district_buttons)
                    )
                return

        location_info = ""
        if user_state.get('city_id'):
            location_info = "\n\nℹ️ Попробуйте изменить фильтр локации."
        
        location_button_text = await get_location_button_text(user_state)
        
        keyboard = [
            [InlineKeyboardButton(location_button_text, callback_data=f"loc_cat_{category_id}")],
            [InlineKeyboardButton("🔙 К категориям", callback_data="back_to_categories")]
        ]
        
        if message_edit:
            await query.edit_message_text(
                f"😔 <b>В этой категории пока нет товаров</b>{location_info}",
                parse_mode='HTML',
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        else:
            await update.message.reply_text(
                f"😔 <b>В этой категории пока нет товаров</b>{location_info}",
                parse_mode='HTML',
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
        return
    
    user_states[user_id]['current_category'] = category_id
    user_states[user_id]['current_page'] = page
    
    keyboard = []
    for product in products:
        positions_count = len(product.get('positions', []))
        keyboard.append([InlineKeyboardButton(
            f"{product['name']} ({positions_count})", 
            callback_data=f"prod_{product['id']}"
        )])
    
    pagination_buttons = []
    if page > 1:
        pagination_buttons.append(InlineKeyboardButton("◀️ Назад", callback_data=f"page_{category_id}_{page-1}"))
    if len(products) == 7 and page * 7 < total_count:
        pagination_buttons.append(InlineKeyboardButton("Вперёд ▶️", callback_data=f"page_{category_id}_{page+1}"))
    
    if pagination_buttons:
        keyboard.append(pagination_buttons)
    
    location_button_text = await get_location_button_text(user_state)
    
    keyboard.append([
        InlineKeyboardButton("🔙 К категориям", callback_data="back_to_categories"),
        InlineKeyboardButton(location_button_text, callback_data=f"loc_cat_{category_id}")
    ])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    message_text = f"📦 <b>Выберите продукт (страница {page}):</b>"
    
    if message_edit:
        await query.edit_message_text(
            message_text,
            parse_mode='HTML',
            reply_markup=reply_markup
        )
    else:
        await update.message.reply_text(
            message_text,
            parse_mode='HTML',
            reply_markup=reply_markup
        )

async def show_product_details(update: Update, context: ContextTypes.DEFAULT_TYPE, product_id):
    """Показать детали продукта и его позиции"""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    user_state = user_states.get(user_id, {})
    
    product = await api.get_product_by_id(product_id)
    # Ensure we look for positions in the WHOLE city
    positions = await api.get_positions_by_product(
        product_id, 
        user_state.get('city_id'), 
        None # Ignore district_id from state for now, we want to select it here
    )
    
    if not product:
        await query.edit_message_text(
            "😔 <b>Товар не найден</b>",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔙 Назад", callback_data=f"cat_{user_state.get('current_category', '')}")]
            ])
        )
        return
    
    user_states[user_id]['current_product'] = product_id
    
    # Group positions by district
    districts_map = {}
    for pos in positions:
        if pos.get('district'):
            d_id = pos['district']['id']
            d_name = pos['district']['name']
            districts_map[d_id] = d_name
    
    # Message header
    product_caption = (
        f"<b>📦 {product['name']}</b>\n\n"
        f"📝 {product.get('description', 'Описание отсутствует')}\n\n"
    )

    if not positions:
         # No positions in city
        keyboard = [[InlineKeyboardButton("🔙 К товарам", callback_data=f"cat_{user_state.get('current_category', '')}")]]
        text = product_caption + "😔 <b>Нет в наличии в вашем городе.</b>"
    elif not districts_map:
        # Positions exist but no district info?? Maybe directly show positions?
        # Fallback to direct positions list if no district info
         text = product_caption + "📍 <b>Выберите позицию:</b>"
         keyboard = []
         for position in positions:
            keyboard.append([InlineKeyboardButton(
                f"💰 {position['price']} $ - {position['name']}", 
                callback_data=f"pos_{position['id']}"
            )])
         keyboard.append([InlineKeyboardButton("🔙 К товарам", callback_data=f"cat_{user_state.get('current_category', '')}")])
    else:
        # Show Districts
        text = product_caption + "📍 <b>Выберите район, где хотите забрать товар:</b>"
        keyboard = []
        for d_id, d_name in districts_map.items():
            keyboard.append([InlineKeyboardButton(
                f"📍 {d_name}", 
                callback_data=f"prod_dist_{product_id}_{d_id}"
            )])
        keyboard.append([InlineKeyboardButton("🔙 К товарам", callback_data=f"cat_{user_state.get('current_category', '')}")])

    # Send/Edit Message
    if product.get('img'):
        image_url = await build_public_media_url(product['img'])
        try:
             # If reusing existing message, we can't easily turn text to photo without deleting. 
             # But callback usually audits existing message.
             # Simplest: Delete and Send New if photo? Or just reply_photo if it was text?
             # `edit_message_media` is complex.
             # Let's try sending new photo if we can, or just text if image fails.
             # Actually keeping it simple: if there is an image, we try to send it as a fresh message?
             # But user clicked "Product X".
             await query.message.reply_photo(
                photo=image_url,
                caption=text,
                parse_mode='HTML',
                reply_markup=InlineKeyboardMarkup(keyboard)
            )
             return
        except Exception as e:
            logger.error(f"Error sending product photo: {e}")

    # Fallback text
    try:
        await query.edit_message_text(
            text,
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    except Exception as e:
        # If trying to edit photo caption with text only or vice versa
        await query.message.reply_text(
            text,
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup(keyboard)
        )

async def show_positions_for_product_and_district(update: Update, context: ContextTypes.DEFAULT_TYPE, product_id, district_id):
    """Показать позиции товара в конкретном районе"""
    query = update.callback_query
    await query.answer()
    
    product = await api.get_product_by_id(product_id)
    # Fetch positions for specific district
    positions = await api.get_positions_by_product(
        product_id, 
        None, # city_id is implied by district usually, or passed? API supports just districtId?
        # BotAPI get_positions_by_product takes city_id, district_id.
        district_id=district_id
    )
    
    # Filter by district manually if needed, but API should handle it if passed.
    # Note: get_positions_by_product implementation:
    # if district_id: params['districtId'] = district_id
    
    keyboard = []
    for position in positions:
         keyboard.append([InlineKeyboardButton(
            f"💰 {position['price']} $ - {position['name']}", 
            callback_data=f"pos_{position['id']}"
        )])
    
    keyboard.append([InlineKeyboardButton("🔙 К выбору района", callback_data=f"prod_{product_id}")])
    
    if query.message.photo:
        await query.message.delete()
        await query.message.reply_text(
            f"<b>📦 {product['name']}</b>\n\n"
            f"📍 <b>Район выбран.</b> Выберите позицию:",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    else:
        await query.edit_message_text(
            f"<b>📦 {product['name']}</b>\n\n"
            f"📍 <b>Район выбран.</b> Выберите позицию:",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup(keyboard)
        )

async def show_position_details(update: Update, context: ContextTypes.DEFAULT_TYPE, position_id):
    """Показать детали позиции"""
    query = update.callback_query
    await query.answer()
    
    position = await api.get_position_by_id(position_id)
    
    if not position:
        await query.edit_message_text(
            "😔 <b>Позиция не найдена</b>",
            parse_mode='HTML'
        )
        return
    
    product = position.get('product', {})
    city = position.get('city', {})
    district = position.get('district', {})
    
    message_text = (
        f"<b>📍 {position['name']}</b>\n\n"
        f"💰 <b>Цена: {position['price']} $</b>\n"
        f"📦 Упаковка: {position['type']}\n"
        f"🏙️ Город: {city.get('name', 'Не указан')}"   
    )
    if district:
        message_text += f"\n📍 Район: {district.get('name')}"
    
    message_text += f"\n🏢 Место: {position['location']}\n"
    # message_text += f"\n\n🛍️ Товар: {product.get('name', 'Не указан')}"
    
    keyboard = [
        [InlineKeyboardButton("🛒 Купить", callback_data=f"buy_{position_id}")],
        [InlineKeyboardButton("🔙 К позициям", callback_data=f"prod_{product.get('id', '')}")]
    ]
    
    await query.edit_message_text(
        message_text,
        parse_mode='HTML',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def show_city_selection_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать выбор города из нижнего меню"""
    await show_city_selection(update, context, from_menu=True)

async def show_city_selection(update: Update, context: ContextTypes.DEFAULT_TYPE, from_menu=False):
    """Показать выбор города"""
    if from_menu:
        cities = await api.get_cities_with_districts()
        
        if not cities:
            await update.message.reply_text(
                "😔 <b>Список городов временно недоступен</b>",
                parse_mode='HTML',
                reply_markup=MAIN_MENU
            )
            return
        
        keyboard = []
        keyboard.append([InlineKeyboardButton("Сбросить локацию", callback_data="reset_location")])
        
        for city in cities:
            keyboard.append([InlineKeyboardButton(
                f"🏙️ {city['name']}", 
                callback_data=f"city_{city['id']}"
            )])

        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "🏙️ <b>Выберите город:</b>\n",
            parse_mode='HTML',
            reply_markup=reply_markup
        )
    else:
        # Вызов из callback query
        query = update.callback_query
        await query.answer()
        
        cities = await api.get_cities_with_districts()
        
        if not cities:
            await query.edit_message_text(
                "😔 <b>Список городов временно недоступен</b>",
                parse_mode='HTML'
            )
            return
        
        keyboard = []
        keyboard.append([InlineKeyboardButton("Сбросить локацию", callback_data="reset_location")])
        
        for city in cities:
            keyboard.append([InlineKeyboardButton(
                f"🏙️ {city['name']}", 
                callback_data=f"city_{city['id']}"
            )])

        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            "🏙️ <b>Выберите город:</b>\n",
            parse_mode='HTML',
            reply_markup=reply_markup
        )


async def handle_city_selected(update: Update, context: ContextTypes.DEFAULT_TYPE, city_id):
    """Обработать выбор города (сохранить и показать меню)"""
    query = update.callback_query
    await query.answer()
    
    cities = await api.get_cities_with_districts()
    city = next((c for c in cities if c['id'] == int(city_id)), None)
    
    if not city:
        await query.edit_message_text(
            "😔 <b>Город не найден</b>",
            parse_mode='HTML'
        )
        return
    
    user_id = query.from_user.id
    user_states[user_id]['city_id'] = int(city_id)
    user_states[user_id]['district_id'] = None
    
    # Show confirmation
    await query.edit_message_text(
        f"📍 <b>Город выбран!</b>\n\n"
        f"🏙️ {city['name']}\n\n",
        parse_mode='HTML'
    )
    
    # Activate Main Menu
    await query.message.reply_text(
        "🏠 <b>Главное меню активировано</b>",
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )
    return


async def reset_location(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Сбросить локацию пользователя"""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    user_states[user_id]['city_id'] = None
    user_states[user_id]['district_id'] = None
    
    await query.edit_message_text(
        "✅ <b>Локация сброшена!</b>\n\n"
        "Теперь вы будете видеть товары из всех городов и районов.",
        parse_mode='HTML',
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🛍️ В каталог", callback_data="back_to_categories")],
            # [InlineKeyboardButton("🏠 В меню", callback_data="back_to_menu")]
        ])
    )

async def reset_district(update: Update, context: ContextTypes.DEFAULT_TYPE, city_id):
    """Сбросить район, оставив только город"""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    user_states[user_id]['city_id'] = city_id
    user_states[user_id]['district_id'] = None
    
    cities = await api.get_cities_with_districts()
    city = next((c for c in cities if c['id'] == int(city_id)), None)
    
    await query.edit_message_text(
        f"🏙️ Город: <b>{city['name'] if city else 'Город'}</b>\n\n"
        f"✅ Теперь вы будете видеть товары из всех районов этого города.",
        parse_mode='HTML',
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🛍️ В каталог", callback_data="back_to_categories")],
            # [InlineKeyboardButton("🏠 В меню", callback_data="back_to_menu")]
        ])
    )

async def save_location(update: Update, context: ContextTypes.DEFAULT_TYPE, city_id, district_id=None):
    """Сохранить выбранную локацию"""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    user_states[user_id]['city_id'] = city_id
    user_states[user_id]['district_id'] = district_id
    
    cities = await api.get_cities_with_districts()
    city = next((c for c in cities if c['id'] == int(city_id)), None)
    district = None
    
    if district_id and city:
        district = next((d for d in city.get('districts', []) if d['id'] == int(district_id)), None)
    
    location_text = f"🏙️ {city['name'] if city else 'Город'}"
    if district:
        location_text += f", 📍 {district['name']}"
    
    await query.edit_message_text(
            f"✅ <b>Местоположение сохранено!</b>\n\n"
            f"{location_text}\n\n"
            f"Теперь товары будут фильтроваться по выбранной локации",
            parse_mode='HTML'
        )
        
    # Restore Main Menu
    await query.message.reply_text(
        "🏠 <b>Главное меню активировано</b>",
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )

async def show_about_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать 'О нас' из нижнего меню"""
    about_content = await api.get_bot_content('about')
    
    if about_content and about_content.get('image'):
        image_url = await build_public_media_url(about_content['image'])
        try:
            await update.message.reply_photo(
                photo=image_url,
                caption=about_content.get('text', 'ℹ️ О нашей компании'),
                parse_mode='HTML',
                reply_markup=MAIN_MENU
            )
            return
        except Exception as e:
            logger.error(f"Error sending about photo: {e}")
    
    await update.message.reply_text(
        about_content.get('text', 'ℹ️ О нашей компании') if about_content 
        else "ℹ️ <b>О нашей компании</b>",
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )

async def show_help_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать help из нижнего меню"""
    help_content = await api.get_bot_content('help')
    
    if help_content and help_content.get('image'):
        image_url = await build_public_media_url(help_content['image'])
        try:
            await update.message.reply_photo(
                photo=image_url,
                caption=help_content.get('text', '❓ help 1'),
                parse_mode='HTML',
                reply_markup=MAIN_MENU
            )
            return
        except Exception as e:
            logger.error(f"Error sending help photo: {e}")
    
    await update.message.reply_text(
        help_content.get('text', '❓ help 2') if help_content 
        else "❓ <b>Помощь</b>\n\nПо всем вопросам обращайтесь в поддержку.",
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )


async def handle_purchase(update: Update, context: ContextTypes.DEFAULT_TYPE, position_id):
    """Обработчик покупки позиции"""
    query = update.callback_query
    await query.answer()

    user = query.from_user
    position = await api.get_position_by_id(position_id)

    if not position:
        await query.edit_message_text(
            "❌ <b>Ошибка:</b> Позиция не найдена",
            parse_mode='HTML'
        )
        return

    client = await api.get_or_create_client(
        user.id,
        user.username,
        user.first_name,
        user.last_name
    )

    if not client:
        await query.edit_message_text(
            "❌ <b>Ошибка:</b> Не удалось создать клиента",
            parse_mode='HTML'
        )
        return

    wallet = await sync_wallet_balance(user.id)
    price = float(position['price'])

    if wallet['balance'] < price:
        missing = price - wallet['balance']
        await query.edit_message_text(
            (
                "❌ <b>Недостаточно средств</b>\n\n"
                f"Стоимость позиции: <b>{format_amount(price)} $</b>\n"
                f"Доступно: <b>{format_amount(wallet['balance'])} $</b>\n"
                f"Не хватает: <b>{format_amount(missing)} $</b>"
            ),
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("💳 Пополнить баланс", callback_data="balance_menu")],
                [InlineKeyboardButton("Проверить оплату", callback_data=f"check_pending_{user.id}")]
            ])
        )
        return

    # Добавляем покупку
    purchase_result = await api.add_purchase(
        user.id,
        position_id,
        position['name'],
        position['price'],
        position.get('product', {}).get('name')
    )

    if purchase_result and purchase_result.get('success'):
        await sync_wallet_balance(user.id)
        await query.edit_message_text(
            f"✅ <b>Заказ оформлен!</b>\n\n"
            f"Продукт: {position.get('product', {}).get('name', 'Неизвестно')}\n"
            f"Позиция: {position['name']}\n"
            f"Цена: {position['price']} $\n\n",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("Вернуться в каталог", callback_data="back_to_categories")],
            ])
        )
    else:
        await query.edit_message_text(
            "❌ <b>Ошибка при оформлении заказа</b>\n\n",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔙 Назад", callback_data=f"pos_{position_id}")]
            ])
        )

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик inline кнопок"""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    
    if data.startswith("prod_dist_"):
        # prod_dist_{product_id}_{district_id}
        parts = data.split("_")
        product_id = parts[2]
        district_id = parts[3]
        await show_positions_for_product_and_district(update, context, product_id, district_id)
    elif data.startswith("cat_"):
        category_id = data.split("_")[1]
        await show_products(update, context, category_id)
    elif data.startswith("page_"):
        _, category_id, page = data.split("_")
        await show_products(update, context, category_id, int(page))
    elif data.startswith("prod_"):
        product_id = data.split("_")[1]
        await show_product_details(update, context, product_id)
    elif data.startswith("pos_"):
        position_id = data.split("_")[1]
        await show_position_details(update, context, position_id)
    elif data.startswith("topup_custom_"):
        asset = data.split("_")[2]
        await prompt_custom_topup(update, asset)
    elif data.startswith("topup_"):
        _, asset, amount = data.split("_")
        await create_topup_invoice(update, asset, float(amount))
    elif data.startswith("check_pending_"):
        await show_balance_menu(update, context)
    elif data.startswith("check_"):
        invoice_id = data.split("_")[1]
        await check_invoice_status(update, invoice_id)
    elif data.startswith("city_"):
        city_id = data.split("_")[1]
        await handle_city_selected(update, context, city_id)
    elif data.startswith("district_"):
        _, city_id, district_id = data.split("_")
        await save_location(update, context, city_id, district_id)
    elif data.startswith("reset_district_"):
        city_id = data.split("_")[2]
        await reset_district(update, context, city_id)
    elif data == "reset_location":
        await reset_location(update, context)
    elif data.startswith("loc_"):
        # выбор локации из разных контекстов
        parts = data.split("_")
        if parts[1] == "cat":
            await show_city_selection(update, context)
        elif parts[1] == "prod":
            await show_city_selection(update, context)
    elif data == "back_to_categories":
        await show_categories_from_callback(update, context)
    elif data == "back_to_cities":
        await show_city_selection(update, context)
    elif data == "back_to_menu":
        await query.edit_message_text(
            "🏠 <b>Главное меню</b>\n\n"
            "Используйте кнопки ниже для навигации:",
            parse_mode='HTML',
            reply_markup=MAIN_MENU
        )
    elif data == "balance_menu":
        await show_balance_menu(update, context)
    elif data.startswith("buy_"):
        position_id = data.split("_")[1]
        await handle_purchase(update, context, position_id)
    elif data.startswith("switch_district_"):
        _, _, category_id, city_id, district_id = data.split("_")
        user_id = query.from_user.id
        user_states[user_id]['city_id'] = int(city_id)
        user_states[user_id]['district_id'] = int(district_id)
        await show_products(update, context, category_id)

async def show_categories_from_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать категории из callback"""
    query = update.callback_query
    categories = await api.get_catalog_categories()
    
    if not categories:
        await query.edit_message_text(
            "😔 <b>Категории временно недоступны</b>",
            parse_mode='HTML',
            reply_markup=MAIN_MENU
        )
        return
    
    keyboard = []
    for category in categories:
        products_count = category.get('productsCount', 0)
        keyboard.append([InlineKeyboardButton(
            f"{category['name']} ({products_count})", 
            callback_data=f"cat_{category['id']}"
        )])
    
    await query.edit_message_text(
        "🏪 <b>Выберите категорию:</b>",
        parse_mode='HTML',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

def main():
    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("balance", show_balance_menu))

    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_main_menu))
    
    application.add_handler(CallbackQueryHandler(button_handler))
    
    logger.info("Bot is starting...")
    application.run_polling()

if __name__ == '__main__':
    main()
