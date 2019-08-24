import keys from '../config/google_keys.json';

export default class GoogleHelper {

  /**
   * Constructor function for this library
   * @return {null} 
   */
  constructor() {
    // Configure some of the variables for the gapis sdk
    this.scope = "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive";
    this.discoveryDocs = ["https://slides.googleapis.com/$discovery/rest?version=v1"];
    this.masterDeckId = '1msaQkrQWsomqfVd7v6PwwbeHsKVtq2x3spNQDM96F4g';

    // Hidden vars for use in getter/setter functions
    this.currentUser_ = null;
  }
  
  /**
   * Load the Gapis into a script tag and append it to the body of the document
   */
  load() {
    return new Promise((resolve, reject) => {
      // Create the script object and assign the SRC
      const script = document.createElement("script");
      script.src = "//apis.google.com/js/api.js";

      // Set the onload callback
      script.onload = () => {
        this.loadGapiModules()
          .then(() => {
            resolve();
          });
      };

      // Append gapi to the body of the page
      document.body.appendChild(script);
    });
  }

  /** 
   * Load GAPI modules
   */
  loadGapiModules() {
    return new Promise((resolve, reject) => {
      // Load all the modules we need
      window.gapi.load('auth2:picker:client',
        () => {
          // Init the auth2 library
          window.gapi.client.init({ 
            apiKey: keys.web.api_key,
            clientId: keys.web.client_id,
            scope: this.scope,
            discoveryDocs: this.discoveryDocs
          })
          .then(() => {
            // Check if user is already signed in
            this.currentUser_ = window.gapi.auth2.getAuthInstance().currentUser.get();
            resolve();
          });
        }
      );
    });
  }

  /** 
   * Perform sign in for the user
   */
  signIn() {
    return new Promise((resolve, reject) => {
      // Attempt to get the user to log in
      window.gapi.auth2.getAuthInstance().signIn({ scope: this.scope }).then((result) => resolve());
    });
  }

  /** 
   * Getter to tell if the user is signed in
   */
  get isSignedIn() {
    return this.currentUser_.isSignedIn();
  }

  get authToken() {
    return this.currentUser_.getAuthResponse().access_token;
  }

  /**
   * Get the Google username of the user
   */
  getUsername() {
    if(this.currentUser_.isSignedIn()) {
      return this.currentUser_.w3.ofa;
    }
    // TODO: replace with thrown error
    return null;
  } 

  /**
   * Generate a picker view and show it
   */
  createPicker(selectedFolderCallback) {
    let view = new window.google.picker.View(window.google.picker.ViewId.FOLDERS);
    let folderView = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS);
    folderView.setSelectFolderEnabled(true);
    view.setMimeTypes("application/vnd.google-apps.folder");

    let picker = new window.google.picker.PickerBuilder()
      .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.google.picker.Feature.MINE_ONLY)
      .addView(folderView)
      .setOAuthToken(this.authToken)
      .setDeveloperKey(keys.web.api_key)
      .setCallback(selectedFolderCallback)
      .setTitle("Choose Output Folder")
      .build();
    picker.setVisible(true);
  }

  /**
   * Load the drive client
   */
  loadDriveClient() {
    return new Promise((resolve, reject) => {
      if(!this.driveLoaded) {
        window.gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest")
        .then(() =>{
          this.driveLoaded = true;
          resolve();
        });
      }
      else {
        resolve();
      }
    });
  }

  /**
   * Copy the master deck into the folder that the user selected
   */
  copyMasterDeck(filename, destinationFolder) {
    return new Promise((resolve, reject) => {
      this.loadDriveClient()
      .then(() => {
        window.gapi.client.drive.files.copy({
          "fileId": this.masterDeckId,
          "resource": {
            "name": filename,
            "parents": [
              destinationFolder
            ]
          }
        })
        .then((response) => resolve(response.result.id));
      });
    });
  }

  /**
   * Get presentation from google drive by id
   */
  getPresentation(fileId) {
    return new Promise((resolve, reject) => {
      window.gapi.client.slides.presentations.get({
        presentationId: fileId,
      })
      .then((response) => resolve(response.result));
    });
  }

  batchUpdateDeck(deckId, updates) {
    return new Promise((resolve, reject) => {
      window.gapi.client.slides.presentations.batchUpdate({
        "presentationId": deckId,
        "resource": {
          "requests": updates
        }
      }).then(() => resolve());
    });
  }

  /**
   *
   */
  updateSlidesByReplacingText(deckId, options) {
    let replacements = [];
    for(const replacement of options) {
      replacements.push({
        "replaceAllText": {
          "pageObjectIds": [
            replacement.slide.objectId
          ],
          "containsText": {
            "text": replacement.searchString
          },
          "replaceText": replacement.replacementString
        }
      });
    }

    return new Promise((resolve, reject) => {
      this.batchUpdateDeck(deckId, replacements).then(() => resolve());
    });
  }

  deleteSlides(deckId, slideIds) {
    return new Promise((resolve, reject) => {
      // Build the delete objects
      let deletions = [];
      for(const slideId of slideIds) {
        deletions.push({
          deleteObject: {
            objectId: slideId
          }
        });
      }

      // Just need to pass it through for now
      this.batchUpdateDeck(deckId, deletions).then(() => resolve());
    })
  }

}