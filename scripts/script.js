'use strict';

var app = (function () {
    var config = window.bb_config || {};

    /**
     * Constants
     * */
    var AJAX_HEADERS = {
            'Content-Type': 'application/json',
            'X-SERVER-KEY': 'Developer'
        },
        FILE_NAME_LOADER = 'loader.svg',
        SCREEN_WIDTH_TABLET = 768,
        SCREEN_WIDTH_PHONE = 480,
        START_COUNT_GOODS_ITEMS_DESKTOP = 12,
        START_COUNT_GOODS_ITEMS_TABLET = 8,
        START_COUNT_GOODS_ITEMS_PHONE = 4,
        STEP_LAZY_LOAD_GOODS_ITEMS = 4,
        SRC_IMG = '/wp-content/plugins/bloombees-ecommerce-shop/images/',
        URL_DATA_PRODUCTS = 'https://bloombees.com/h/api/checkouts/byuniqueid/' + config.brand,
        URL_PRODUCT = 'https://bloombees.com/';

    /**
     * Private variables
     * */
    var store,
        lastIndexGoodsItem = 0;

    /**
     * Save data products
     * */
    var saveDataProducts = function (response) {
        var documentWidth = document.documentElement.clientWidth,
            countItems = START_COUNT_GOODS_ITEMS_DESKTOP;

        if (documentWidth >= SCREEN_WIDTH_PHONE && documentWidth < SCREEN_WIDTH_TABLET) {
            countItems = START_COUNT_GOODS_ITEMS_TABLET;
        } else if (documentWidth < SCREEN_WIDTH_PHONE) {
            countItems = START_COUNT_GOODS_ITEMS_PHONE;
        }


        store = JSON.parse(response).data.Checkout_products;

        buildGoods(store, lastIndexGoodsItem, countItems);
    };

    /**
     * Build goods
     * */
    var buildGoods = function (data, startIndexItem, countItems) {
        var goods = document.getElementById('goods'),
            hash = window.location.hash,
            id = hash.replace('#', '');

        /**
         * Remove lazy load handlers
         * */
        if (startIndexItem >= data.length) {
            window.removeEventListener('wheel', lazyLoadLoader);
            window.removeEventListener('touchend', lazyLoadLoader);
        }

        /**
         * Build details card when linking
         * */
        if (id) {
            var detailItem = data.filter(function (item) {
                return item.Product_id === id;
            })[0];

            if (null !== detailItem) {
                var images = detailItem.Product_pictures;

                var image = new Image();
                image.addEventListener('load', function () {
                    buildDetailsCard(hash);
                });

                if (images == null) {
                    image.src = '';
                } else if (typeof images[0] == 'string') {
                    image.src = images[0];
                } else if (images[0] != undefined && images[0].Picture_sourceUrl != undefined) {
                    image.src = images[0].Picture_sourceUrl;
                }
            }
        }

        /**
         * Build goods items
         * */
        data.forEach(function (item, i) {
            if ((i > startIndexItem || (i==0 && startIndexItem==0)) && i < startIndexItem + countItems) {
                var goodsItemResourceInnerHTML = document.getElementById('goodsItemResource').innerHTML,
                    newGoodsItem = document.createElement('li');

                newGoodsItem.className = 'c-goods--item u-box-shadow u-animation--fade-in';
                newGoodsItem.setAttribute('data-goods-item', '');

                var images = item.Product_pictures;
                //console.log(item.Product_pictures);
                if (images) {
                    item.Product_pictures = images.map(function (subitem) {
                        //console.log("subitem:");
                        //console.log(typeof subitem);
                        if (typeof subitem === 'object') {

                            if (subitem.Picture_url)
                            {
                                return subitem.Picture_url;
                            }
                        }
                    });

                    var image = new Image();
                    

                    image.addEventListener('load', function () {
                        var goodsItem = document.querySelector('[data-goods-img="' + item.Product_id + '"]');

                        if (item.Product_pictures[0] != undefined) {
                            goodsItem.style.backgroundImage = 'url("' + item.Product_pictures[0] + '")';
                        } else {
                            console.log("loading spinner:");
                            console.log(item);
                            goodsItem.style.backgroundImage = 'url("' + SRC_IMG + FILE_NAME_LOADER + '")';
                        }
                    });

                    // var ele = document.getElementById("badge");
                 

                    if (item.Product_pictures[0] != undefined) {
                        image.src = item.Product_pictures[0];
                    } else {
                        image.src = SRC_IMG + FILE_NAME_LOADER;
                    }

                    goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace(/(%goodsItemLinkReplace%)/g, item.Product_id);
                    goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemNameReplace%', trimString(item.Product_name, 40));
                    goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemCostReplace%', item.Product_price + ' €');
                    // ele.style.display = "block";

                    

                    if (item.Product_priceOfReference != 0) {
                        goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemPromoReplace%', item.Product_priceOfReference + ' €');
                        goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemTagReplace%', '<div id="badge" class="badge"><span>PROMO</span></div>');
                        //ele.style.display = "block";                      
                    }
                    else{
                        goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemPromoReplace%','');
                        goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemTagReplace%', '');
                        // ele.style.display = "none";
                    }

                    newGoodsItem.innerHTML = goodsItemResourceInnerHTML;

                    goods.appendChild(newGoodsItem);
                } else if (images == null) {
                    goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace(/(%goodsItemLinkReplace%)/g, item.Product_id);
                    goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemNameReplace%', trimString(item.Product_name, 40));
                    goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemCostReplace%', item.Product_price + ' €');
                    goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemPromoReplace%', item.Product_priceOfReference + ' €');
                    goodsItemResourceInnerHTML = goodsItemResourceInnerHTML.replace('%goodsItemTagReplace%', '<div id="badge" class="badge"><span>PROMO</span></div>');


                    newGoodsItem.innerHTML = goodsItemResourceInnerHTML;

                    goods.appendChild(newGoodsItem);


                    var goodsItem = document.querySelector('[data-goods-img="' + item.Product_id + '"]');
                    goodsItem.style.backgroundImage = 'url()';
                }
            }
        });

        lastIndexGoodsItem += countItems - 1;
    };

    /**
     * Build details card
     * */
    var buildDetailsCard = function (hash) {
        var detailsCardOld = document.getElementById('detailsCard');
        if (detailsCardOld != null && detailsCardOld.getAttribute('item') == hash) {
            return;
        }

        if (detailsCardOld) {
            detailsCardOld.parentNode.removeChild(detailsCardOld);
        }

        var id = hash.replace('#', ''),
            detailItem = store.filter(function (item) {
                return item.Product_id === id;
            })[0];

        var detailsCardResource = document.getElementById('detailsCardResource'),
            detailsCardResourceInnerHTML = detailsCardResource.innerHTML,
            newDetailsCard = document.createElement('section');

        newDetailsCard.className = 'c-details-card';
        newDetailsCard.id = 'detailsCard';

        if (detailItem.Product_pictures != null && detailItem.Product_pictures[0] != undefined) {
            detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%detailsCardImgReplace%', detailItem.Product_pictures[0]);
        } else {
            detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%detailsCardImgReplace%', '');
        }

        detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%detailsCardTitleReplace%', detailItem.Product_name);
        detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%detailsCardDescDataSlideReplace%', detailItem.Product_id);

        

                    if (detailItem.Product_priceOfReference != 0) {
                    detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%detailsCardDescPromoEUReplace%', detailItem.Product_priceOfReference + ' €');
                    }
                    else {
                    detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%detailsCardDescPromoEUReplace%','');
                    }


        detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%detailsCardDescCostEUReplace%', detailItem.Product_price + ' €');
        detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%detailsCardDescDescReplace%', detailItem.Product_description);
        detailsCardResourceInnerHTML = detailsCardResourceInnerHTML.replace('%buyNowLink%', URL_PRODUCT + detailItem.Product_bbcode);


        newDetailsCard.innerHTML = detailsCardResourceInnerHTML;
        newDetailsCard.setAttribute('item', hash);

        detailsCardResource.parentNode.insertBefore(newDetailsCard, detailsCardResource);

        newDetailsCard.scrollIntoView(true);
        if (config.enable_offset) {
            var fixedMenuHeight = 100;
            var scrolledY = window.scrollY;
            if (scrolledY) {
                window.scroll(0, scrolledY - fixedMenuHeight);
            }
        }


        buildDetailsCardImgSlider(detailItem);
        onChangeSliderItem(detailItem);
    };

    var trimString = function (string, length) {
        return string.length > length ?
            string.substring(0, length - 3) + "..." :
            string;
    };

    /**
     * Build details card image slider
     * */
    var buildDetailsCardImgSlider = function (detailItem) {
        var detailsImages = detailItem.Product_pictures ? detailItem.Product_pictures : [];
        if (detailsImages.length > 1) {
            var navSliderResource = document.getElementById('navSliderResource'),
                navImgSliderResource = document.getElementById('navImgSliderResource');
            detailsImages.forEach(function (item, i) {
                /**
                 * Slider navigation
                 * */
                var navSliderItem = document.createElement('li');

                navSliderItem.className = i === 0 ? 'c-nav-slider--item active' : 'c-nav-slider--item';
                navSliderItem.setAttribute('data-slide', i);

                navSliderResource.appendChild(navSliderItem);

                /**
                 * Slider image navigation
                 * */
                var image = new Image();
                image.addEventListener('load', function () {
                    if (typeof item == 'object') {
                        navImgSliderItem.style.backgroundImage = 'url("' + item.Picture_sourceUrl + '")';
                    } else {
                        navImgSliderItem.style.backgroundImage = 'url("' + item + '")'
                    }
                });
                image.src = item;

                var navImgSliderItem = document.createElement('li');

                navImgSliderItem.className = i === 0 ?
                    'c-nav-img-slider--item u-box-shadow u-bg-images--contain2 active' :
                    'c-nav-img-slider--item u-box-shadow u-bg-images--contain2';
                navImgSliderItem.setAttribute('data-slide', i);
                navImgSliderItem.style.backgroundImage = 'url("' + SRC_IMG + FILE_NAME_LOADER + '")';

                navImgSliderResource.appendChild(navImgSliderItem);
            });

        }
    };

    /**
     * Lazy load loader
     * */
    var lazyLoadLoader = function () {
        var documentHeight = document.documentElement.clientHeight,
            lastGoodsItem = document.querySelector('[data-goods-item]:last-child');
        if (lastGoodsItem != null) {
            var lastGoodsItemBottom = lastGoodsItem.getBoundingClientRect().bottom;

            if (lastGoodsItemBottom < documentHeight) {
                buildGoods(store, lastIndexGoodsItem, STEP_LAZY_LOAD_GOODS_ITEMS);
            }
        }

    };

    /**
     * Lazy load
     * */
    var lazyLoad = function () {
        window.addEventListener('wheel', lazyLoadLoader);
        window.addEventListener('touchend', lazyLoadLoader);
    };

    /**
     * Change slider item
     * */
    var onChangeSliderItem = function (detailItem) {
        var detailsImages = detailItem.Product_pictures ? detailItem.Product_pictures : '';

        if (detailsImages.length > 1) {
            var detailsCard = document.getElementById('detailsCard');

            detailsCard.addEventListener('click', function (event) {
                var target = event.target;
                if (target.className.toString().indexOf('c-btn') === -1) {
                    event.preventDefault();
                }
                while (!target.hasAttribute('data-slide') || target !== detailsCard) {
                    if (target.hasAttribute('data-slide')) {
                        var slideNumber = +target.getAttribute('data-slide'),
                            detailsCardImg = document.getElementById('detailsCardImg');

                        detailsCardImg.style.backgroundImage = 'url("' + detailItem.Product_pictures[slideNumber] + '")';

                        var navSliderAll = document.querySelectorAll('[data-slide]');
                        Array.prototype.forEach.call(navSliderAll, function (item) {
                            var itemNumber = +item.getAttribute('data-slide');

                            if (itemNumber !== slideNumber) {
                                item.classList.remove('active');
                            } else {
                                item.classList.add('active');
                            }
                        });

                        return;
                    } else {
                        if (target.tagName !== 'BODY') {
                            target = target.parentNode;
                        } else {
                            return;
                        }
                    }
                }
            });

            onSwipe(detailItem);
        }
    };

    /**
     * Swipe
     * */
    var onSwipe = function (detailItem) {
        var initialPoint,
            finalPoint,
            detailsCardImg = document.getElementById('detailsCardImg');

        detailsCardImg.addEventListener('touchstart', function (event) {
            // event.preventDefault();
            // event.stopPropagation();
            initialPoint = event.changedTouches[0];
        });

        detailsCardImg.addEventListener('touchend', function (event) {
            // event.preventDefault();
            // event.stopPropagation();
            finalPoint = event.changedTouches[0];

            var xAbs = Math.abs(initialPoint.pageX - finalPoint.pageX);

            if (xAbs > 20) {
                var slideNumberActive = +document.querySelector('[data-slide].active').getAttribute('data-slide'),
                    slideNumberLast = +document.querySelector('[data-slide]:last-child').getAttribute('data-slide'),
                    detailsCardImg = document.getElementById('detailsCardImg'),
                    navSliderAll = document.querySelectorAll('[data-slide]');

                if (finalPoint.pageX < initialPoint.pageX) {
                    /** Swipe to the left */
                    slideNumberActive += slideNumberActive !== slideNumberLast ? 1 : 0;
                } else {
                    /** Swipe to the right */
                    slideNumberActive -= slideNumberActive !== 0 ? 1 : 0;
                }

                detailsCardImg.style.backgroundImage = 'url("' + detailItem.Product_pictures[slideNumberActive] + '")';

                Array.prototype.forEach.call(navSliderAll, function (item) {
                    var itemNumber = +item.getAttribute('data-slide');

                    if (itemNumber !== slideNumberActive) {
                        item.classList.remove('active');
                    } else {
                        item.classList.add('active');
                    }
                });
            }
        });
    };

    /**
     * Click on goods item
     * */
    var onChooseGoods = function () {
        var goods = document.getElementById('goods');

        goods.addEventListener('click', function (event) {
            event.preventDefault();
            var target = event.target;

            while (!target.hasAttribute('data-goods-link') || target !== goods) {
                if (target.hasAttribute('data-goods-link')) {
                    window.location.hash = target.getAttribute('href');
                    return;
                } else {
                    if (target.tagName !== 'BODY') {
                        target = target.parentNode;
                    } else {
                        return;
                    }
                }
            }
        });
    };

    /**
     * Handler of changing url
     * */
    var onPopState = function () {
        window.addEventListener('popstate', function () {
            var hash = window.location.hash;

            buildDetailsCard(hash);
        });
    };

    /**
     * Ajax GET
     * */
    var ajaxGet = function (url, callback) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', url, true);

        for (var key in AJAX_HEADERS) {
            xhr.setRequestHeader(key, AJAX_HEADERS[key]);
        }

        xhr.send();

        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4) return;

            if (xhr.status != 200) {
                console.error('Data loading error.\n' + xhr.status + ': ' + xhr.statusText);
            } else {
                callback(xhr.responseText);
            }
        };
    };

    return {
        /**
         * Get data
         * */
        getData: function () {
            ajaxGet(URL_DATA_PRODUCTS, saveDataProducts);
        },

        /**
         * Initialization
         * */
        init: function () {
            onChooseGoods();
            onPopState();
            app.getData();
            lazyLoad();
        }
    }
})();

/**
 * Dom ready
 * */
document.addEventListener('DOMContentLoaded', app.init);