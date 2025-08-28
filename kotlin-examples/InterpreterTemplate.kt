// Your team name: ByteStorm Champions

import kotlinx.serialization.json.*
import java.text.SimpleDateFormat
import java.util.*

/**
 * Main interpreter function that processes your JSON DSL and sends commands to the printer
 * 
 * @param jsonString The JSON string containing your receipt DSL
 * @param printer The Epson printer interface (will be real hardware during judging!)
 */
fun interpret(jsonString: String, printer: EpsonPrinter) {
    try {
        // Parse the JSON DSL
        val receipt = parseReceipt(jsonString)
        
        // Process each element in sequence
        for (element in receipt.elements) {
            when (element.type) {
                "text" -> {
                    val text = element.content ?: ""
                    val style = TextStyle(
                        bold = element.style?.bold ?: false,
                        size = parseTextSize(element.style?.size ?: "NORMAL"),
                        underline = element.style?.underline ?: false
                    )
                    printer.addText(text, style)
                }
                "barcode" -> {
                    val data = element.data ?: ""
                    val type = BarcodeType.valueOf(element.barcodeType ?: "CODE39")
                    val options = BarcodeOptions(
                        width = BarcodeWidth.MEDIUM,
                        height = 50,
                        hri = true
                    )
                    printer.addBarcode(data, type, options)
                }
                "qrcode" -> {
                    val data = element.data ?: ""
                    val options = QRCodeOptions(
                        size = 3,
                        errorCorrection = QRErrorCorrection.MEDIUM
                    )
                    printer.addQRCode(data, options)
                }
                "image" -> {
                    val imageData = element.imageData ?: ""
                    val options = ImageOptions(
                        width = 384,
                        alignment = Alignment.CENTER
                    )
                    printer.addImage(imageData, options)
                }
                "divider" -> {
                    printer.addText("-".repeat(48), null)
                    printer.addFeedLine(1)
                }
                "feed" -> {
                    val lines = element.lines ?: 1
                    printer.addFeedLine(lines)
                }
                "dynamic" -> {
                    val field = element.field ?: ""
                    val value = resolveDynamicField(field, null)
                    printer.addText(value, null)
                }
                else -> {
                    println("Warning: Unknown element type: ${element.type}")
                }
            }
        }
        
        // Always cut paper at the end
        printer.cutPaper()
        
    } catch (e: Exception) {
        // Error handling - print error on receipt
        printer.addText("ERROR: ${e.message}", TextStyle(bold = true))
        printer.addFeedLine(2)
        printer.cutPaper()
    }
}

/**
 * Enhanced interpreter that handles Order data for dynamic fields
 */
fun interpret(jsonString: String, orderData: String, printer: EpsonPrinter) {
    try {
        // Parse order data first
        val order = parseOrderData(orderData)
        
        // Parse the JSON DSL
        val receipt = parseReceipt(jsonString)
        
        // Process each element in sequence
        for (element in receipt.elements) {
            when (element.type) {
                "text" -> {
                    val text = element.content ?: ""
                    val style = TextStyle(
                        bold = element.style?.bold ?: false,
                        size = parseTextSize(element.style?.size ?: "NORMAL"),
                        underline = element.style?.underline ?: false
                    )
                    printer.addText(text, style)
                }
                "barcode" -> {
                    val data = element.data ?: ""
                    val type = BarcodeType.valueOf(element.barcodeType ?: "CODE39")
                    val options = BarcodeOptions(
                        width = BarcodeWidth.MEDIUM,
                        height = 50,
                        hri = true
                    )
                    printer.addBarcode(data, type, options)
                }
                "qrcode" -> {
                    val data = element.data ?: ""
                    val options = QRCodeOptions(
                        size = 3,
                        errorCorrection = QRErrorCorrection.MEDIUM
                    )
                    printer.addQRCode(data, options)
                }
                "image" -> {
                    val imageData = element.imageData ?: ""
                    val options = ImageOptions(
                        width = 384,
                        alignment = Alignment.CENTER
                    )
                    printer.addImage(imageData, options)
                }
                "divider" -> {
                    printer.addText("-".repeat(48), null)
                    printer.addFeedLine(1)
                }
                "feed" -> {
                    val lines = element.lines ?: 1
                    printer.addFeedLine(lines)
                }
                "dynamic" -> {
                    val field = element.field ?: ""
                    val value = resolveDynamicField(field, order)
                    printer.addText(value, null)
                }
                else -> {
                    println("Warning: Unknown element type: ${element.type}")
                }
            }
        }
        
        // Always cut paper at the end
        printer.cutPaper()
        
    } catch (e: Exception) {
        // Error handling - print error on receipt
        printer.addText("ERROR: ${e.message}", TextStyle(bold = true))
        printer.addFeedLine(2)
        printer.cutPaper()
    }
}

/**
 * Parse the JSON string into your receipt data structure
 * Implement your own parsing logic based on your JSON DSL format
 */
fun parseReceipt(json: String): Receipt {
    val jsonElement = Json.parseToJsonElement(json)
    val jsonObject = jsonElement.jsonObject
    
    val elements = mutableListOf<ReceiptElement>()
    
    // Example parsing - modify based on your DSL structure
    jsonObject["elements"]?.jsonArray?.forEach { elementJson ->
        val elementObj = elementJson.jsonObject
        elements.add(ReceiptElement(
            type = elementObj["type"]?.jsonPrimitive?.content ?: "",
            content = elementObj["content"]?.jsonPrimitive?.contentOrNull,
            data = elementObj["data"]?.jsonPrimitive?.contentOrNull,
            field = elementObj["field"]?.jsonPrimitive?.contentOrNull,
            lines = elementObj["lines"]?.jsonPrimitive?.intOrNull,
            imageData = elementObj["imageData"]?.jsonPrimitive?.contentOrNull,
            barcodeType = elementObj["barcodeType"]?.jsonPrimitive?.contentOrNull,
            style = elementObj["style"]?.let { styleJson ->
                val styleObj = styleJson.jsonObject
                ElementStyle(
                    bold = styleObj["bold"]?.jsonPrimitive?.booleanOrNull ?: false,
                    size = styleObj["size"]?.jsonPrimitive?.contentOrNull?.let { 
                        TextSize.valueOf(it) 
                    } ?: TextSize.NORMAL
                )
            }
        ))
    }
    
    return Receipt(elements = elements)
}

/**
 * Resolve dynamic field values from Order data or use defaults
 */
fun resolveDynamicField(field: String, order: OrderData?): String {
    return when (field) {
        "{store_name}" -> order?.storeName ?: "BYTE BURGERS"
        "{store_address}" -> "123 Tech Ave, Silicon Valley"
        "{store_number}" -> order?.storeNumber ?: "001"
        "{cashier_name}" -> order?.customerInfo?.name ?: "Cashier"
        "{timestamp}" -> order?.let { formatTimestamp(it.timestamp) } ?: formatTimestamp(System.currentTimeMillis())
        "{order_number}" -> order?.orderId ?: "ORD-001234"
        "{order_id}" -> order?.orderId ?: "A-0001"
        "{subtotal}" -> order?.let { formatCurrency(it.subtotal) } ?: "$25.99"
        "{tax}" -> order?.let { formatCurrency(it.taxAmount) } ?: "$2.34"
        "{total}" -> order?.let { formatCurrency(it.totalAmount) } ?: "$28.33"
        "{item_list}" -> order?.let { formatItemList(it.items, it.itemPromotions ?: emptyList()) } ?: "1x Sample Item - $8.99"
        "{customer_name}" -> order?.customerInfo?.name ?: ""
        "{customer_id}" -> order?.customerInfo?.customerId ?: ""
        "{loyalty_points}" -> order?.customerInfo?.loyaltyPoints?.toString() ?: ""
        "{member_status}" -> order?.customerInfo?.memberStatus ?: ""
        "{payment_method}" -> order?.paymentMethod ?: ""
        "{table_number}" -> order?.tableInfo?.tableNumber ?: ""
        "{server_name}" -> order?.tableInfo?.serverName ?: ""
        "{guest_count}" -> order?.tableInfo?.guestCount?.toString() ?: ""
        else -> field // Return as-is if not recognized
    }
}

/**
 * Parse text size string to TextSize enum
 */
fun parseTextSize(sizeString: String): TextSize {
    return when (sizeString.uppercase()) {
        "SMALL" -> TextSize.SMALL
        "NORMAL" -> TextSize.NORMAL
        "LARGE" -> TextSize.LARGE
        "XLARGE" -> TextSize.XLARGE
        else -> TextSize.NORMAL
    }
}

/**
 * Format timestamp to readable date/time string
 */
fun formatTimestamp(timestamp: Long): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
    return formatter.format(Date(timestamp))
}

/**
 * Format currency amount with proper formatting
 */
fun formatCurrency(amount: Double): String {
    return "$%.2f".format(amount)
}

/**
 * Format item list with quantities, names, and prices
 */
fun formatItemList(items: List<OrderItem>, promotions: List<ItemPromotion>): String {
    val itemText = StringBuilder()
    
    for (item in items) {
        itemText.append("${item.quantity}x ${item.name}")
        
        // Add modifiers if present
        item.modifiers?.let { modifiers ->
            if (modifiers.isNotEmpty()) {
                itemText.append(" (${modifiers.joinToString(", ")})")
            }
        }
        
        itemText.append(" - ${formatCurrency(item.totalPrice)}")
        
        // Check for item-specific promotions
        val itemPromo = promotions.find { it.itemSku == item.sku }
        if (itemPromo != null) {
            itemText.append("\n  PROMO: ${itemPromo.promotionName} -${formatCurrency(itemPromo.discountAmount)}")
        }
        
        itemText.append("\n")
    }
    
    return itemText.toString().trimEnd()
}

/**
 * Parse Order data from JSON string
 */
fun parseOrderData(orderJson: String): OrderData {
    val jsonElement = Json.parseToJsonElement(orderJson)
    val jsonObject = jsonElement.jsonObject
    
    return OrderData(
        orderId = jsonObject["orderId"]?.jsonPrimitive?.content ?: "",
        storeNumber = jsonObject["storeNumber"]?.jsonPrimitive?.content ?: "",
        storeName = jsonObject["storeName"]?.jsonPrimitive?.content ?: "",
        timestamp = jsonObject["timestamp"]?.jsonPrimitive?.longOrNull ?: System.currentTimeMillis(),
        items = parseItems(jsonObject["items"]?.jsonArray ?: JsonArray(emptyList())),
        subtotal = jsonObject["subtotal"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
        taxRate = jsonObject["taxRate"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
        taxAmount = jsonObject["taxAmount"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
        totalAmount = jsonObject["totalAmount"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
        itemPromotions = parseItemPromotions(jsonObject["itemPromotions"]?.jsonArray),
        orderPromotions = parseOrderPromotions(jsonObject["orderPromotions"]?.jsonArray),
        customerInfo = parseCustomerInfo(jsonObject["customerInfo"]?.jsonObject),
        paymentMethod = jsonObject["paymentMethod"]?.jsonPrimitive?.contentOrNull,
        splitPayments = parseSplitPayments(jsonObject["splitPayments"]?.jsonArray),
        tableInfo = parseTableInfo(jsonObject["tableInfo"]?.jsonObject)
    )
}

fun parseItems(itemsArray: JsonArray): List<OrderItem> {
    return itemsArray.map { itemElement ->
        val itemObj = itemElement.jsonObject
        OrderItem(
            name = itemObj["name"]?.jsonPrimitive?.content ?: "",
            quantity = itemObj["quantity"]?.jsonPrimitive?.intOrNull ?: 1,
            unitPrice = itemObj["unitPrice"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
            totalPrice = itemObj["totalPrice"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
            sku = itemObj["sku"]?.jsonPrimitive?.contentOrNull,
            category = itemObj["category"]?.jsonPrimitive?.contentOrNull,
            modifiers = itemObj["modifiers"]?.jsonArray?.map { it.jsonPrimitive.content }
        )
    }
}

fun parseItemPromotions(promotionsArray: JsonArray?): List<ItemPromotion> {
    return promotionsArray?.map { promoElement ->
        val promoObj = promoElement.jsonObject
        ItemPromotion(
            itemSku = promoObj["itemSku"]?.jsonPrimitive?.content ?: "",
            promotionName = promoObj["promotionName"]?.jsonPrimitive?.content ?: "",
            discountAmount = promoObj["discountAmount"]?.jsonPrimitive?.doubleOrNull ?: 0.0
        )
    } ?: emptyList()
}

fun parseOrderPromotions(promotionsArray: JsonArray?): List<OrderPromotion> {
    return promotionsArray?.map { promoElement ->
        val promoObj = promoElement.jsonObject
        OrderPromotion(
            promotionName = promoObj["promotionName"]?.jsonPrimitive?.content ?: "",
            discountAmount = promoObj["discountAmount"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
            promotionType = promoObj["promotionType"]?.jsonPrimitive?.content ?: ""
        )
    } ?: emptyList()
}

fun parseCustomerInfo(customerObj: JsonObject?): CustomerInfo? {
    return customerObj?.let {
        CustomerInfo(
            customerId = it["customerId"]?.jsonPrimitive?.content ?: "",
            name = it["name"]?.jsonPrimitive?.content ?: "",
            memberStatus = it["memberStatus"]?.jsonPrimitive?.contentOrNull,
            loyaltyPoints = it["loyaltyPoints"]?.jsonPrimitive?.intOrNull,
            memberSince = it["memberSince"]?.jsonPrimitive?.contentOrNull
        )
    }
}

fun parseSplitPayments(paymentsArray: JsonArray?): List<SplitPayment> {
    return paymentsArray?.map { paymentElement ->
        val paymentObj = paymentElement.jsonObject
        SplitPayment(
            payerName = paymentObj["payerName"]?.jsonPrimitive?.content ?: "",
            amount = paymentObj["amount"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
            method = paymentObj["method"]?.jsonPrimitive?.content ?: "",
            tip = paymentObj["tip"]?.jsonPrimitive?.doubleOrNull,
            items = paymentObj["items"]?.jsonArray?.map { it.jsonPrimitive.content }
        )
    } ?: emptyList()
}

fun parseTableInfo(tableObj: JsonObject?): TableInfo? {
    return tableObj?.let {
        TableInfo(
            tableNumber = it["tableNumber"]?.jsonPrimitive?.content ?: "",
            serverName = it["serverName"]?.jsonPrimitive?.content ?: "",
            guestCount = it["guestCount"]?.jsonPrimitive?.intOrNull ?: 1,
            serviceRating = it["serviceRating"]?.jsonPrimitive?.intOrNull
        )
    }
}

// Data classes for receipt structure
data class Receipt(
    val elements: List<ReceiptElement>
)

data class ReceiptElement(
    val type: String,
    val content: String? = null,
    val data: String? = null,
    val field: String? = null,
    val lines: Int? = null,
    val imageData: String? = null,
    val barcodeType: String? = null,
    val style: ElementStyle? = null
)

data class ElementStyle(
    val bold: Boolean = false,
    val size: String = "NORMAL",
    val underline: Boolean = false
)

// Data classes for Order structure (matching TypeScript interfaces)
data class OrderData(
    val orderId: String,
    val storeNumber: String,
    val storeName: String,
    val timestamp: Long,
    val items: List<OrderItem>,
    val subtotal: Double,
    val taxRate: Double,
    val taxAmount: Double,
    val totalAmount: Double,
    val itemPromotions: List<ItemPromotion>? = null,
    val orderPromotions: List<OrderPromotion>? = null,
    val customerInfo: CustomerInfo? = null,
    val paymentMethod: String? = null,
    val splitPayments: List<SplitPayment>? = null,
    val tableInfo: TableInfo? = null
)

data class OrderItem(
    val name: String,
    val quantity: Int,
    val unitPrice: Double,
    val totalPrice: Double,
    val sku: String? = null,
    val category: String? = null,
    val modifiers: List<String>? = null
)

data class ItemPromotion(
    val itemSku: String,
    val promotionName: String,
    val discountAmount: Double
)

data class OrderPromotion(
    val promotionName: String,
    val discountAmount: Double,
    val promotionType: String
)

data class CustomerInfo(
    val customerId: String,
    val name: String,
    val memberStatus: String? = null,
    val loyaltyPoints: Int? = null,
    val memberSince: String? = null
)

data class SplitPayment(
    val payerName: String,
    val amount: Double,
    val method: String,
    val tip: Double? = null,
    val items: List<String>? = null
)

data class TableInfo(
    val tableNumber: String,
    val serverName: String,
    val guestCount: Int,
    val serviceRating: Int? = null
)