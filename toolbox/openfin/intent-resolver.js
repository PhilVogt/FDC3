var intentNameLabel;
var supportingAppsList;

function renderIntentProviders(apps) {

    apps.forEach(app => {
        var li = document.createElement("li");
        var textContent = document.createTextNode(app.name);
        var icon = document.createElement("i");
        icon.classList.add("fas");
        icon.classList.add("fa-arrow-circle-right");
        icon.style.marginLeft = "auto";
        icon.style.marginTop = "auto";
        icon.style.marginBottom = "auto";
        var container = document.createElement("div");
        container.style.display = "flex";
        container.appendChild(textContent);
        container.appendChild(icon);

        li.appendChild(container);

        li.addEventListener("click", async () => {
            window.setIntentHandler(app);
            window.close();
        })

        supportingAppsList.appendChild(li);
    });
}

async function initOpenFinParamListener() {
    try {
        const queryStringParams = new URLSearchParams(window.location.search);
        const intentName = queryStringParams.get('intentName');
        const intentLabelContent = document.createTextNode(`Which application do you want to handle the "${intentName}" intent?`);
        intentNameLabel.appendChild(intentLabelContent);
        const win = await fin.Window.getCurrent();
        const options = await win.getOptions();
        const customData = JSON.parse(options.customData);
        if (customData) {
            console.log(JSON.stringify(customData));
            renderIntentProviders(customData);
        }

    } catch (error) {
        console.error(error);
    }
};

window.addEventListener("DOMContentLoaded", () => {
    intentNameLabel = document.getElementById("intentNameLabel");
    supportingAppsList = document.getElementById("supportingAppsList");
    supportingAppsList.style.listStyleType = 'none';
    supportingAppsList.style.padding = 0;
    supportingAppsList.style.margin = 0;

    initOpenFinParamListener();
});