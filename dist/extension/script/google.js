
lyvo.getDetailLinks = async function (search) {
    let search_div = await lyvo.waitForElementPresent(document.body, '#search', 5000)
    if (!search_div) {
        search_div = document.body
    }
    let links = []
    let elements = search_div.querySelectorAll('a:has(h3)')
    for (let i = 0; i < elements.length; i++) {
        let h3 = elements[i].querySelector('h3')
        let title = lyvo.cleanText(h3)
        let url = elements[i].getAttribute('href')
        links.push({ title, url })
    }
    return {
        links: links
    }
}

lyvo.getContent = async function (search) {
    await lyvo.waitLoaded()
    return {
        title: document.title,
        content: lyvo.extractHtmlContent()
    }
}
