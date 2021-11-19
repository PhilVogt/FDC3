const appSupportedIntents = new Map();

async function launchIntentPickerConfirmation(height, width, intent, parentIdentity) {
    const winOption = {
        cornerRounding: { height: 4, width: 4 },
        name: 'modal',
        defaultCentered: true,
        defaultWidth: width,
        defaultHeight: height,
        showTaskbarIcon: false,
        saveWindowState: false,
        includeInSnapshots: false,
        autoShow: false,
        url: 'http://localhost:10000/toolbox/openfin/intent-resolver.html?intentName=' + intent,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        //modalParentIdentity: parentIdentity, // Wrong parent Identity needs to be the parent window of the view that launched the intent request...
        customData: JSON.stringify(appSupportedIntents.get(`intent-handler-${intent}`))
    };

    let win = await fin.Window.create(winOption);
    const webWindow = await win.getWebWindow();
    win.show();

    await win.focus();
    return webWindow;
}


fin.Platform.init({
    interopOverride: async (InteropBroker, provider, options, ...args) => {
        class Override extends InteropBroker {

            async intentHandlerRegistered(payload, clientIdentity) {
                super.intentHandlerRegistered(payload, clientIdentity);
                const handlerId = payload.handlerId;
                if (!appSupportedIntents.has(handlerId)) {
                    appSupportedIntents.set(handlerId, [clientIdentity]);
                } else {
                    const matchingApps = appSupportedIntents.get(handlerId);

                    if (!matchingApps.includes(clientIdentity)) {
                        appSupportedIntents.set(handlerId, [...appSupportedIntents.get(handlerId), clientIdentity]);
                    }
                }
            };

            async setIntentForChildWindow(intent, app) {
                return super.setIntentTarget(intent, { uuid: app.uuid, name: app.name });
            };

            async handleFiredIntent(intent) {
                let moreThanOneAppSupportsThisIntent = false;
                let singleSupportingApp;
                if (appSupportedIntents.has(`intent-handler-${intent.name}`)) {
                    var apps = appSupportedIntents.get(`intent-handler-${intent.name}`);
                    if (apps.length > 1) {
                        moreThanOneAppSupportsThisIntent = true;
                    } else {
                        singleSupportingApp = apps[0];
                    }
                }
                // Launch child/modal window and add callback on the webWindow
                if (moreThanOneAppSupportsThisIntent) {
                    const webWindow = await launchIntentPickerConfirmation(200, 500, intent.name, fin.me.identity);
                    webWindow.setIntentHandler = (app) => {
                        return super.setIntentTarget(intent, { uuid: app.uuid, name: app.name });
                    };
                } else {
                    return super.setIntentTarget(intent, { uuid: singleSupportingApp.uuid, name: singleSupportingApp.name });
                }


                /* super.setIntentTarget({
                    name: "ViewChart",
                    context:
                    {
                        id:
                        {
                            ISIN: "US0378331005",
                            SEDOL: "2046251",
                            ticker: "AAPL"
                        },
                        name: "Apple Inc.",
                        type: "fdc3.instrument"
                    }
                }, { uuid: "fdc3_explained_platform", name: "RightView" }); */
            };
        }
        return new Override(provider, options, ...args);
    }
});