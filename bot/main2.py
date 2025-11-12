import os
import logging
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

NODE_API_URL = os.getenv('NODE_API_URL', 'http://localhost:5050/api')
BOT_TOKEN = os.getenv('BOT_TOKEN')

# логи
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

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

    async def create_crypto_invoice(self, telegram_id, position_id):
        """Создать крипто-счет для оплаты"""
        try:
            data = {
                'telegramId': telegram_id,
                'positionId': position_id
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(f'{self.base_url}/payments/crypto/invoice', json=data) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    error_text = await resp.text()
                    logger.error(f"Failed to create crypto invoice ({resp.status}): {error_text}")
                    return None
        except Exception as e:
            logger.error(f"Error creating crypto invoice: {e}")
            return None

    async def get_payment_details(self, payment_id):
        """Получить информацию о платеже"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.base_url}/payments/{payment_id}') as resp:
                    if resp.status == 200:
                        return await resp.json()
                    error_text = await resp.text()
                    logger.error(f"Failed to get payment details ({resp.status}): {error_text}")
                    return None
        except Exception as e:
            logger.error(f"Error getting payment details: {e}")
            return None

api = BotAPI(NODE_API_URL)

MAIN_MENU = ReplyKeyboardMarkup([
    [KeyboardButton("👤 Профиль"), KeyboardButton("Каталог"), KeyboardButton("🏙️ Город")],
    [KeyboardButton("📦 Заказы"), KeyboardButton("ℹ️ О нас"), KeyboardButton("❓ Помощь")]
], resize_keyboard=True)

# Состояния пользователей
user_states = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    logger.info(f"User {user.id} started the bot")
    
    user_states[user.id] = {
        'city_id': None,
        'district_id': None,
        'current_category': None,
        'current_product': None,
        'current_page': 1
    }
    
    welcome_content = await api.get_bot_content('welcome')
    
    if welcome_content and welcome_content.get('image'):
        image_url = f"http://localhost:5050/{welcome_content['image']}"
        try:
            await update.message.reply_photo(
                photo=image_url,
                caption=welcome_content.get('text', 'welcome 1'),
                parse_mode='HTML',
                reply_markup=MAIN_MENU
            )
            return
        except Exception as e:
            logger.error(f"Error sending welcome photo: {e}")
    
    await update.message.reply_text(
        welcome_content.get('text', 'welcome 2') if welcome_content 
        else 'welcome 3',
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )

async def handle_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик нижнего меню"""
    text = update.message.text
    user_id = update.effective_user.id
    user_state = user_states.get(user_id, {})
    
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
    
    profile_text = (
        f"👤 <b>Профиль</b>\n\n"
        f"🆔 ID: {user_id}\n"
        f"📛 Ник: @{username}\n"
        f"Завершенных покупок: <b>{purchases_count}</b>\n\n"
        f"Ваш город - {location_info}"
    )
    
    await update.message.reply_text(
        profile_text,
        parse_mode='HTML',
        reply_markup=MAIN_MENU
    )

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
                f"  💰 {price}฿\n"
            )

            location_text = purchase.get('location')
            if location_text:
                message_text += f"  📍 {location_text}\n"
            else:
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
    #     f"💰 Общая сумма: <b>{total_amount}฿</b>"
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
                f"   📍 {position_name} | 💰 {price}฿ | 📅 {date}\n"
            )

            if purchase.get('location'):
                message_text += f"   🔑 {purchase['location']}\n"

            message_text += "\n"

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
        user_state.get('district_id'),
        page
    )
    
    if not products:
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
    positions = await api.get_positions_by_product(
        product_id, 
        user_state.get('city_id'), 
        user_state.get('district_id')
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
    
    # Отправляем фото продукта
    if product.get('img'):
        image_url = f"http://localhost:5050/{product['img']}"
        try:
            caption = (
                f"<b>📦 {product['name']}</b>\n\n"
                f"📝 {product.get('description', 'Описание отсутствует')}\n\n"
            )
            
            await query.message.reply_photo(
                photo=image_url,
                caption=caption,
                parse_mode='HTML'
            )
        except Exception as e:
            logger.error(f"Error sending product photo: {e}")
            await query.message.reply_text(
                f"<b>📦 {product['name']}</b>\n\n"
                f"📝 {product.get('description', 'Описание отсутствует')}\n\n",
                parse_mode='HTML'
            )
    else:
        await query.message.reply_text(
            f"<b>📦 {product['name']}</b>\n\n"
            f"📝 {product.get('description', 'Описание отсутствует')}\n\n",
            parse_mode='HTML'
        )
    
    if not positions:
        location_button_text = await get_location_button_text(user_state)
        
        await query.message.reply_text(
            "😔 <b>Нет доступных позиций для этого товара</b>\n\n"
            "Попробуйте изменить фильтр локации.",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton(location_button_text, callback_data=f"loc_prod_{product_id}")],
                [InlineKeyboardButton("🔙 К товарам", callback_data=f"cat_{user_state.get('current_category', '')}")]
            ])
        )
        return
    
    keyboard = []
    for position in positions:
        keyboard.append([InlineKeyboardButton(
            f"💰 {position['price']}฿ - {position['name']}", 
            callback_data=f"pos_{position['id']}"
        )])
    
    location_button_text = await get_location_button_text(user_state)
    
    keyboard.append([
        InlineKeyboardButton("🔙 К товарам", callback_data=f"cat_{user_state.get('current_category', '')}"),
        InlineKeyboardButton(location_button_text, callback_data=f"loc_prod_{product_id}")
    ])
    
    await query.message.reply_text(
        "📍 <b>Доступные позиции:</b>",
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
        f"💰 <b>Цена: {position['price']}฿</b>\n"
        f"📦 Упаковка: {position['type']}\n"
        f"🏙️ Город: {city.get('name', 'Не указан')}"   
    )
    if district:
        message_text += f"\n📍 Район: {district.get('name')}"
    
    message_text += "\n🔒 Локация будет доступна после оплаты.\n"
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


async def show_district_selection(update: Update, context: ContextTypes.DEFAULT_TYPE, city_id):
    """Показать выбор района"""
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
    
    if not city.get('districts'):
        user_id = query.from_user.id
        user_states[user_id]['city_id'] = city_id
        user_states[user_id]['district_id'] = None
        
        await query.edit_message_text(
            f"📍 <b>Город выбран!</b>\n\n"
            f"🏙️ {city['name']}\n\n"
            f"Теперь товары будут фильтроваться по вашему городу.",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🛍️ В каталог", callback_data="back_to_categories")],
                # [InlineKeyboardButton("🏠 В меню", callback_data="back_to_menu")]
            ])
        )
        return
    
    keyboard = []
    keyboard.append([InlineKeyboardButton("Сбросить выбор района", callback_data=f"reset_district_{city_id}")])
    
    for district in city['districts']:
        keyboard.append([InlineKeyboardButton(
            f"📍 {district['name']}", 
            callback_data=f"district_{city_id}_{district['id']}"
        )])
    
    keyboard.append([InlineKeyboardButton("🔙 К выбору города", callback_data="back_to_cities")])
    
    await query.edit_message_text(
        f"📍 <b>Выбор района</b>\n\n"
        f"Город: <b>{city['name']}</b>\n",
        parse_mode='HTML',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

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
        parse_mode='HTML',
        reply_markup=InlineKeyboardMarkup([
            [InlineKeyboardButton("🛍️ В каталог", callback_data="back_to_categories")],
            # [InlineKeyboardButton("🏠 В меню", callback_data="back_to_menu")]
        ])
    )

async def show_about_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Показать 'О нас' из нижнего меню"""
    about_content = await api.get_bot_content('about')
    
    if about_content and about_content.get('image'):
        image_url = f"http://localhost:5050/{about_content['image']}"
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
        image_url = f"http://localhost:5050/{help_content['image']}"
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
    
    invoice_result = await api.create_crypto_invoice(user.id, position_id)

    if not invoice_result or not invoice_result.get('success'):
        await query.edit_message_text(
            "❌ <b>Ошибка:</b> Не удалось создать счёт для оплаты.",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔙 Назад", callback_data=f"pos_{position_id}")]
            ])
        )
        return

    payment_info = invoice_result.get('payment', {})
    invoice_data = invoice_result.get('invoice', {})

    payment_id = payment_info.get('id')
    pay_url = payment_info.get('payUrl') or invoice_data.get('pay_url')
    amount = payment_info.get('amount') or invoice_data.get('amount')
    asset = payment_info.get('asset') or invoice_data.get('asset', '')
    expires_at = payment_info.get('expiresAt') or invoice_data.get('expiration_date')

    if not payment_id or not pay_url:
        await query.edit_message_text(
            "❌ <b>Ошибка:</b> Некорректный ответ платежной системы.",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔙 Назад", callback_data=f"pos_{position_id}")]
            ])
        )
        return

    product_name = position.get('product', {}).get('name', 'Неизвестно')
    amount_text = f"{amount} {asset}" if amount else f"{position['price']}฿"

    message_text = (
        "💳 <b>Оплата заказа</b>\n\n"
        f"🛍️ Товар: {product_name}\n"
        f"📦 Позиция: {position['name']}\n"
        f"💰 К оплате: {amount_text}\n"
    )

    if expires_at:
        message_text += f"⏳ Счёт действует до: {expires_at}\n"

    message_text += (
        "\nПерейдите по ссылке «Оплатить», чтобы завершить покупку.\n"
        "После успешной оплаты нажмите «Проверить оплату», чтобы получить локацию."
    )

    keyboard = [
        [InlineKeyboardButton("💳 Оплатить", url=pay_url)],
        [InlineKeyboardButton("✅ Проверить оплату", callback_data=f"check_payment_{payment_id}")],
        [InlineKeyboardButton("🔙 Назад", callback_data=f"pos_{position_id}")]
    ]

    await query.edit_message_text(
        message_text,
        parse_mode='HTML',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def handle_payment_status(update: Update, context: ContextTypes.DEFAULT_TYPE, payment_id):
    """Проверка статуса оплаты"""
    query = update.callback_query

    payment_response = await api.get_payment_details(payment_id)

    if not payment_response or not payment_response.get('success'):
        await query.answer("Не удалось получить информацию о платеже", show_alert=True)
        return

    payment = payment_response.get('payment', {})
    status = payment.get('status')
    position_info = payment.get('position', {})

    if status == 'paid':
        location = position_info.get('location') or 'Локация недоступна'
        product_name = position_info.get('productName', 'Неизвестно')
        position_name = position_info.get('name', 'Позиция')
        amount = payment.get('amount')
        asset = payment.get('asset', '')

        message_text = (
            "✅ <b>Оплата подтверждена!</b>\n\n"
            f"🛍️ Товар: {product_name}\n"
            f"📦 Позиция: {position_name}\n"
        )

        if amount:
            message_text += f"💰 Сумма: {amount} {asset}\n"

        message_text += f"\n📍 <b>Локация:</b>\n{location}\n\n"
        message_text += "Данные также доступны в разделе «Заказы»."

        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🏪 Вернуться в каталог", callback_data="back_to_categories")],
            [InlineKeyboardButton("📦 Мои заказы", callback_data="back_to_menu")]
        ])

        await query.edit_message_text(
            message_text,
            parse_mode='HTML',
            reply_markup=keyboard
        )
        return

    if status == 'expired':
        position_id = position_info.get('id') or payment.get('positionId')
        keyboard = []
        if position_id:
            keyboard.append([InlineKeyboardButton("🔁 Создать новый счёт", callback_data=f"buy_{position_id}")])
        keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data="back_to_categories")])

        await query.edit_message_text(
            "⏰ <b>Срок оплаты истёк.</b>\n\nПопробуйте оформить новый заказ.",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return

    if status == 'active':
        await query.answer("Счёт ещё не оплачен. Попробуйте позже.", show_alert=True)
        return

    await query.answer("Статус платежа неизвестен.", show_alert=True)

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик inline кнопок"""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    
    if data.startswith("cat_"):
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
    elif data.startswith("city_"):
        city_id = data.split("_")[1]
        await show_district_selection(update, context, city_id)
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
    elif data.startswith("check_payment_"):
        payment_id = data.split("check_payment_")[1]
        await handle_payment_status(update, context, payment_id)
    elif data.startswith("buy_"):
        position_id = data.split("_")[1]
        await handle_purchase(update, context, position_id)

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
    
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_main_menu))
    
    application.add_handler(CallbackQueryHandler(button_handler))
    
    logger.info("Bot is starting...")
    application.run_polling()

if __name__ == '__main__':
    main()