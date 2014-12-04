// Spartan

var PROMOTION_HANDLER_SET = {
    BUY_TWO_GET_ONE_FREE: function (promotionInfo, purchasesList, promotionsList) {
        // itemsBSMap is a map of Barcode <=> Sum
        const itemsBSMap = purchasesList.getMap();
        for (var itemCode in itemsBSMap) {
            if (promotionInfo.barcodes.indexOf(itemCode) > 0) {
                promotionsList.add(itemCode, Math.floor(itemsBSMap[itemCode] / 3));
            }
        }
    },
    OTHER_PROMOTION: function (promotionInfo, purchasesList, promotionsListOut) {

    }
};

function ProductList() {
    // mapItemBS is a map of Barcode <=> Sum
    var mapItemBS = {};
    var arrProducts = loadAllItems();

    this.add = function (barcode, sum) {
        if (sum <= 0)
            return;
        if (mapItemBS[barcode] == null) {
            mapItemBS[barcode] = sum;
            return;
        }
        mapItemBS[barcode] += sum;
    };

    this.remove = function (barcode, sum) {
        if (sum <= 0)
            return;
        if (mapItemBS[barcode] == null) {
            return;
        }
        if ((mapItemBS[barcode] -= sum) <= 0)
            delete mapItemBS[barcode];
    };

    this.getSum = function (barcode) {
        if (mapItemBS[barcode] == null) {
            return 0;
        }
        return mapItemBS[barcode];
    };

    this.getMap = function () {
        return mapItemBS;
    };

    this.findProduceByBarcode = function (barcode) {
        for (var key in arrProducts) {
            if (arrProducts[key].barcode == barcode)
                return arrProducts[key];
        }
        return null;
    };

    this.toString = function (discountList) {
        var rtnStr = '';
        for (var key in mapItemBS) {
            var currentProduceInfo = this.findProduceByBarcode(key);
            rtnStr += '名称：' + currentProduceInfo.name + '，数量：' + mapItemBS[key] + currentProduceInfo.unit;
            if (discountList != null) {
                rtnStr += '，单价：' + currentProduceInfo.price.toFixed(2) + '(元)，小计：';
                rtnStr += (currentProduceInfo.price * (this.getSum(key) - discountList.getSum(key))).toFixed(2) + '(元)';
            }
            rtnStr += '\n';
        }
        return rtnStr;
    };

    this.calcTotalPrice = function (discountList) {
        var totalPrice = 0.00;
        for (var key in mapItemBS) {
            var currentProduceInfo = this.findProduceByBarcode(key);
            totalPrice += this.getSum(key) * currentProduceInfo.price;
            if (discountList != null) {
                totalPrice -= discountList.getSum(key) * currentProduceInfo.price;
            }
        }
        return totalPrice;
    };
}


function generatePurchaseList(purchasesStream) {
    var rtnList = new ProductList();
    for (var key in purchasesStream) {
        var strListItem = purchasesStream[key];
        var arrSplit = strListItem.split('-');

        if ((arrSplit.length != 1) && (arrSplit.length != 2)) {
            throw new Error('Input stream format invalid: ' + purchasesStream[key]);
        }
        if (arrSplit.length == 1) {
            rtnList.add(arrSplit[0], 1);
        }
        if (arrSplit.length == 2) {
            rtnList.add(arrSplit[0], parseInt(arrSplit[1], 10));
        }
    }
    return rtnList;
}

function generatePromotionsList(purchasesList) {
    var promotionsList = new ProductList();
    var arrPromotionsInfo = loadPromotions();
    for (var key in arrPromotionsInfo) {
        if (!(arrPromotionsInfo[key].type in PROMOTION_HANDLER_SET)) {
            throw new Error('No promotion handler defined for label: ' + arrPromotionsInfo[key].type);
        }
        PROMOTION_HANDLER_SET[arrPromotionsInfo[key].type](arrPromotionsInfo[key], purchasesList, promotionsList);
    }
    return promotionsList;
}

function printInventory(purchasesStream) {
    var listBuy = generatePurchaseList(purchasesStream);
    var listExtra = generatePromotionsList(listBuy);
    var rtnStr = '';
    rtnStr += '***<没钱赚商店>购物清单***\n';
    rtnStr += listBuy.toString(listExtra);
    rtnStr += '----------------------\n';
    rtnStr += '挥泪赠送商品：\n';
    rtnStr += listExtra.toString();
    rtnStr += '----------------------\n';
    rtnStr += '总计：' + listBuy.calcTotalPrice(listExtra).toFixed(2) + '(元)\n';
    rtnStr += '节省：' + listExtra.calcTotalPrice().toFixed(2) + '(元)\n';
    rtnStr += '**********************';

    console.log(rtnStr);
    return rtnStr;
}