
//(function($) { 
/**
* GFace session shall be refreshed (kept alive) every 5 mins
*/
class SessionRefresher {
  static TIMEOUT = 100000; // 5 mins

  pointer = null;

  async start(token, validateToken, logoutCb) {
    this.stop();
    this.pointer = setInterval(async () => {
      if (await validateToken(token)) {
        return;
      }
      this.stop();
      logoutCb();
    }, SessionRefresher.TIMEOUT);
  }



  stop() {
    this.pointer && clearInterval(this.pointer);
    this.pointer = null;
  }
}

async function runIntercom() {
    const token = getToken();

    if (!token) {
      return;
    }


    await axios.get('https://rest.api.gface.com/gface-rest/user/get/my.json?token=' + token)
      .then(function (res) {

        if (res.data.rsp.stat == "fail") {
          return false;
        }

        if (res.data.rsp.stat !== "ok") {
          throw new Error("Cannot to login");
          return false;
        }
        if ( typeof window === "undfined" || "intercomSettings" in window ) {
          console.log("not defined")
          return;
        }
        const payload = res.data.rsp.payload[0];

        payload.seed.user.email = getEmail();
        activatedDate = new Date().getTime();

  
        //run Widget
        installIntercom(payload.seed.user.firstname, payload.seed.user.lastname, payload.seed.user.email, activatedDate);

        window.addEventListener('load', function () {
          //....
          const loginWidget = document.getElementById('loginWidget');
          const widgetContainer = document.getElementById('widgetContainer');
          widgetContainer.style.display = "none";

          if (loginWidget) {
            loginWidget.remove(); // Removes the login Button to Intercom
            //const loginWidget = document.getElementsByClassName("intercom");
          }
        });



        const sessionRefresher = new SessionRefresher();
        //const token = getToken();
        try {
          sessionRefresher.start(token, async (token) => {
            const res = await axios.get('https://rest.api.gface.com/gface-rest/auth/session/check.json?token=' + token);
            return res.data.rsp.stat === "ok";
          }, () => {
            console.info("Disconnected by session refresher");
            // run your log out function here
          });
        } catch (e) {
          console.error(e);
        }



    });
}

/**
 * 
 * @returns token 
 */
function getToken() {

  const query = new URL(location.href);
  //console.log(myURLObj.searchParams.get("token"));
  if (typeof query === "object" && query.searchParams.get("token")) {
    localStorage.setItem("token", query.searchParams.get("token"));
    return query.searchParams.get("token");
  }
  return localStorage.getItem("token");
}


/**
 * @returns email
 */
function getEmail() {
  const url = new URL(location.href);
  const E_SALT = "a49vR4HHnLFqdyJk";
  var encoded = typeof url === "object" && url.searchParams.get("ca_payload") ? decodeURIComponent(url.searchParams.get("ca_payload")) : localStorage.getItem("ca_payload");

  if (typeof url === "object" && url.searchParams.get("ca_payload")) {
    localStorage.setItem("ca_payload", encoded);
  }

  return CryptoJS.AES.decrypt(encoded, E_SALT).toString(CryptoJS.enc.Utf8);
}


/**
 * Run intercom Widget
 *
 * @param {*} firstname 
 * @param {*} lastname 
 * @param {*} email 
 * @param {*} activatebydate 
 */
function installIntercom(firstname, lastname, email, activatebydate) {

  //Set your APP_ID
  var APP_ID = "tninw8fm";
  var current_user_email = email;
  var current_user_firstname = firstname;
  var current_user_lastname = lastname;
  var current_activatebydate = activatebydate;

  window.intercomSettings = {
    app_id: APP_ID,
    name: current_user_firstname + " " + current_user_lastname, // Full name
    email: current_user_email, // Email address
    created_at: current_activatebydate // current_user_id
  };
  (function () { var w = window; var ic = w.Intercom; if (typeof ic === "function") { ic('reattach_activator'); ic('update', w.intercomSettings); } else { var d = document; var i = function () { i.c(arguments); }; i.q = []; i.c = function (args) { i.q.push(args); }; w.Intercom = i; var l = function () { var s = d.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = 'https://widget.intercom.io/widget/' + APP_ID; var x = d.getElementsByTagName('script')[0]; x.parentNode.insertBefore(s, x); }; if (document.readyState === 'complete') { l(); } else if (w.attachEvent) { w.attachEvent('onload', l); } else { w.addEventListener('load', l, false); } } })();


}

// })(); 

runIntercom();



