def start_with_location(page):
    page.evaluate("""() => {
        Object.defineProperty(window, 'isSecureContext', {configurable:true, value:true});
        Object.defineProperty(navigator, 'geolocation', {
            configurable:true,
            value:{
                watchPosition(success) {
                    return setTimeout(() => success({coords:{latitude:54.9966, longitude:-7.3086, accuracy:10}}), 0);
                },
                clearWatch(id) { clearTimeout(id); }
            }
        });
    }""")
