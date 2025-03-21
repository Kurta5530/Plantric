/**
 * Common JS function
 */
if (!window.lyvo) {
    window.lyvo = {}
}

/**
 * Extract html content
 */
lyvo.extractHtmlContent = function (element) {
    element = element || document.body
    let main = element.querySelector('main')
    let content = ''
    if (main) {
        let articles = main.querySelectorAll('article')
        if (articles && articles.length > 0) {
            for (let i = 0; i < articles.length; i++) {
                content += articles[i].innerText.trim() + '\n'
            }
        } else {
            content += main.innerText.trim()
        }
    } else {
        let articles = element.querySelectorAll('article')
        if (articles && articles.length > 0) {
            for (let i = 0; i < articles.length; i++) {
                content += articles[i].innerText.trim() + '\n'
            }
        }
    }
    content = content.trim()
    if (!content) {
        content = element.innerText
    }
    return content.replaceAll(/\n+/g, '\n').replaceAll(/ +/g, ' ').trim()
}

/**
 * Element text (remove consecutive spaces and line breaks)
 * 
 * @param {HTMLElement|string} object
 * @returns text
 */
lyvo.cleanText = function(object) {
    let str = (typeof object == 'string') ? object : object?.innerText
    return str ? str.replaceAll(/\s+/g, ' ').trim() : ''
}

/**
 * sleep
 * 
 * @param {number} time millisecond
 */
lyvo.sleep = function(time) {
    return new Promise(resolve => setTimeout(() => resolve(), time))
}

/**
 * element displayed
 * 
 * @param {HTMLElement} element 
 */
lyvo.isDisplayed = function (element) {
    return element && window.getComputedStyle(element).getPropertyValue('display') != 'none'
}

/**
 * click
 * 
 * @param {HTMLElement} element
 */
lyvo.click = function(element) {
    if (element.click) {
        element.click()
    } else {
        element.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
        }))
    }
}

/**
 * Trigger simulated input
 */
lyvo.sendKeys = function(element, str, clear, keypress) {
    element.focus && element.focus()
    if (clear) {
        if (element.value == undefined) {
            element.textContent = ''
        } else {
            for (let i = 0; i < element.value.length; i++) {
                element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }))
            }
            element.value = ''
        }
    }
    if (keypress) {
        Array.from(str).forEach(key => {
            element.dispatchEvent(new KeyboardEvent('keypress', { key }))
        })
        element.value += str
        element.dispatchEvent(new Event('input'))
    } else {
        if (element.value == undefined) {
          element.textContent += str
        } else {
          element.value += str
        }
        element.dispatchEvent(new Event('input', { bubbles: true }))
    }
}

/**
 * Waiting for Dom to change
 */
lyvo.waitForDomChanged = function (targetElement, fun, timeout, config, firstExecute) {
    targetElement = targetElement || document.body
    return new Promise((resolve) => {
        if (firstExecute) {
            let result = fun({})
            if (result) {
                resolve(result)
            }
        }
        var observer = { value: null }
        let timeId = setTimeout(() => {
            observer.value && observer.value.disconnect()
            resolve()
        }, timeout)
        observer.value = new MutationObserver((mutations) => {
            try {
                let result = fun(mutations)
                if (result) {
                    clearTimeout(timeId)
                    observer.value && observer.value.disconnect()
                    resolve(result)
                }
            } catch (e) {}
        });
        if (!config) {
            config = {}
        }
        observer.value.observe(targetElement, { attributes: true, childList: true, subtree: true, ...config })
    })
}

/**
 * Wait for the page to finish loading after onload
 */
lyvo.waitLoaded = async function() {
    await lyvo.waitForDomChanged(document.body, () => document.readyState == 'complete', 5000, {}, true)
    await lyvo.sleep(500)
}

/**
 * Wait for the element to present
 */
lyvo.waitForElementPresent = function (targetElement, cssSelector, timeout) {
    targetElement = targetElement || document.body
    return lyvo.waitForDomChanged(targetElement, () => targetElement.querySelector(cssSelector), timeout, { attributes: false }, true)
}

/**
 * Wait for the element to displayed
 */
lyvo.waitForElementDisplayed = function (targetElement, cssSelector, timeout) {
    targetElement = targetElement || document.body
    return lyvo.waitForDomChanged(targetElement, () => {
        let element = targetElement.querySelector(cssSelector)
        if (element) {
            let visibility = window.getComputedStyle(element).getPropertyValue('display')
            if (visibility != 'none') {
                return element
            } else {
                return false
            }
        } else {
            return false
        }
    }, timeout, {}, true)
}

/**
 * Wait for the element to present
 */
lyvo.waitForElementNotPresent = function (targetElement, cssSelector, timeout) {
    targetElement = targetElement || document.body
    return lyvo.waitForDomChanged(targetElement, () => !targetElement.querySelector(cssSelector), timeout, { attributes: false }, true)
}

/**
 * Waiting for element to be invisible
 */
lyvo.waitForElementNotDisplayed = function (targetElement, cssSelector, timeout) {
    targetElement = targetElement || document.body
    return lyvo.waitForDomChanged(targetElement, () => {
        let element = targetElement.querySelector(cssSelector)
        if (element) {
            let visibility = window.getComputedStyle(element).getPropertyValue('display')
            if (visibility != 'none') {
                return false
            } else {
                return true
            }
        } else {
            return true
        }
    }, timeout, {}, true)
}