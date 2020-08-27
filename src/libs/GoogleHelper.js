import keys from "../config/google_keys.json";

export default class GoogleHelper {
  /**
   * Constructor function for this library
   * @return {null}
   */
  constructor() {
    // Configure some of the variables for the gapis sdk
    this.seMasterDeckId = '1zGxQQKJVNf5ygyRNeli_K4y6AzLOZ4mkX5wQVH0NmU4';
    this.psscMasterDeckId = '15GqL5AjUsYrQSIt50jYxu4kdDZXYkGtzT686OBolOeg';
    this.csmMasterDeckId = '1CdUUw03_QeDu8arq_tTDxJpJRTwSBT1YRaEzUnbB9Qs';
    this.dataMasterDeckId = '1NJWB9jfmJm89wO33gAfI_7bC_fJ7vIcFZW-1IgW8Z1Y';
    this.ab2MasterDeckId = '1jfuN0HEuinbnwU0QVJjH1YDh-dv36DfZ69AC8kRPGxo';

    this.pocPlanId = '1Mov-LfNrEb1ftxPP4YGjUBxlAUMrLBXbFZ9vT3bYA9U'; 
    this.scope =
      "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive";
    this.discoveryDocs = [
      "https://slides.googleapis.com/$discovery/rest?version=v1"
    ];
    //this.masterDeckId = "1zGxQQKJVNf5ygyRNeli_K4y6AzLOZ4mkX5wQVH0NmU4";

    // Hidden vars for use in getter/setter functions
    this.currentUser_ = null;
  }
  /**
   * Load the GAPIs into a script tag and append it to the body of the document
   * @return {null}
   */
  load() {
    return new Promise((resolve, reject) => {
      // Create the script object and assign the SRC
      const script = document.createElement("script");
      script.src = "//apis.google.com/js/api.js";

      // Set the onload callback
      script.onload = () => {
        this.loadGapiModules().then(() => {
          resolve();
        });
      };

      // Append gapi to the body of the page
      document.body.appendChild(script);
    });
  }

  /**
   * Load google api modules that are required
   * @return {Promise} Promise
   */
  loadGapiModules() {
    return new Promise((resolve, reject) => {
      // Load all the modules we need
      window.gapi.load("auth2:picker:client", () => {
        // Init the auth2 library
        window.gapi.client
          .init({
            apiKey: keys.web.api_key,
            clientId: keys.web.client_id,
            scope: this.scope,
            discoveryDocs: this.discoveryDocs
          })
          .then(() => {
            // Check if user is already signed in
            this.currentUser_ = window.gapi.auth2
              .getAuthInstance()
              .currentUser.get();
            resolve();
          });
      });
    });
  }

  /**
   * Perform sign in for the user
   * @return {Promise} promise
   */
  signIn() {
    return new Promise((resolve, reject) => {
      // Attempt to get the user to log in
      window.gapi.auth2
        .getAuthInstance()
        .signIn({ scope: this.scope })
        .then(result => resolve());
    });
  }

  /**
   * Getter to tell if a user is signed in or not
   * @return {Boolean} Whether the user is signed in
   */
  get isSignedIn() {
    return this.currentUser_.isSignedIn();
  }

  /**
   * Getter for the user's auth token/access token/oauth token
   * @return {string} oAuth token
   */
  get authToken() {
    return this.currentUser_.getAuthResponse().access_token;
  }

  /**
   * Get the username of the user from google
   * @return {string} The username if they are logged in, null if not
   */
  getUsername() {
    
    if (this.currentUser_.isSignedIn()) {
      var profile = this.currentUser_.getBasicProfile();

      return profile.getName();    }
    // TODO: replace with thrown error
    return null;
  }

  getEmail() {
    
    if (this.currentUser_.isSignedIn()) {
      var profile = this.currentUser_.getBasicProfile();

      return profile.getEmail();    }
    // TODO: replace with thrown error
    return null;
  }

  /**
   * Generates a picker view and shows it on screen to the user
   * @param  {function} selectedFolderCallback Callback for when a user selects a folder in the picker
   * @return {null}
   */
  createPicker(selectedFolderCallback) {
    let view = new window.google.picker.View(
      window.google.picker.ViewId.FOLDERS
    );
    let folderView = new window.google.picker.DocsView(
      window.google.picker.ViewId.FOLDERS
    );
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
   * Load the drive client for using drive apis
   * @return {Promise} promise
   */
  loadDriveClient() {
    return new Promise((resolve, reject) => {
      if (!this.driveLoaded) {
        window.gapi.client
          .load(
            "https://content.googleapis.com/discovery/v1/apis/drive/v3/rest"
          )
          .then(() => {
            this.driveLoaded = true;
            resolve();
          });
      } else {
        resolve();
      }
    });
  }

  /**
   * Copy the master deck into the new folder location
   * @param  {string} filename          The filename for the new master deck
   * @param  {string} destinationFolder Folder id for where the new master deck should be copied to
   * @return {Promise}                  Promise
   */
  copyMasterDeck(filename, destinationFolder, team, tries = 0) {
    let masterId = null;
    if (team === "se"){
      masterId = this.seMasterDeckId;
    } else if(team === "pssc"){
      masterId = this.psscMasterDeckId;
    } else if(team === "csm"){
      masterId = this.csmMasterDeckId;
    } else if(team === "data"){
      masterId = this.dataMasterDeckId;
    } else if(team === "ab2"){
      masterId = this.ab2MasterDeckId;
    } else {
      masterId = this.seMasterDeckId;
    }

    return this.loadDriveClient().then(() => {
      return window.gapi.client.drive.files
        .copy({
          fileId: masterId,
          resource: {
            name: filename,
            parents: [destinationFolder]
          }
        })
        .then(response => response.result.id)
        .catch(err => {
          console.log("Error with copying master deck: ", err);
          if (tries < 3) {
            console.log("Retrying");
            return this.copyMasterDeck(filename, destinationFolder, team, tries + 1);
          } else {
            console.log("Giving up");
            alert('Sorry, Google Drive was unable to generate the new deck. Please try again.');
            throw err;
          }
        });
    });
  }

  copyPoCPlan(fileName, destinationFolder, tries = 0) {


    return this.loadDriveClient().then(() => {
      return window.gapi.client.drive.files
        .copy({
          fileId: this.pocPlanId,
          resource: {
            name: fileName,
            parents: [destinationFolder]
          }
        })
        .then(response => response.result.id)
        .catch(err => {
          console.log("Error with copying poc plan: ", err);
          if (tries < 3) {
            console.log("Retrying");
            return this.copyPoCPlan(fileName, destinationFolder, tries + 1);
          } else {
            console.log("Giving up");
            throw err;
          }
        });
    });
  }

  updateFilename(deckId, newFilename) {
    return new Promise((resolve, reject) => {
      window.gapi.client.drive.files
        .update({
          fileId: deckId,
          name: newFilename
        })
        .then(done => resolve(done))
        .catch(err => {
          console.log(err);
        });
    });
  }

  /**
   * Get a presentation from google using the file id
   * @param  {string} fileId ID of the file on google drive
   * @return {Promise}       Promise
   */
  getPresentation(fileId) {
    return new Promise((resolve, reject) => {
      window.gapi.client.slides.presentations
        .get({
          presentationId: fileId
        })
        .then(response => resolve(response.result));
    });
  }

  /**
   * Perform a batch update to a deck on google
   * @param  {string} deckId  The ID of the deck that needs to be updated
   * @param  {array} updates  The updates that need to be performed
   * @return {Promise}        Promise
   */
  batchUpdateDeck(deckId, updates) {
    return new Promise((resolve, reject) => {
      window.gapi.client.slides.presentations
        .batchUpdate({
          presentationId: deckId,
          resource: {
            requests: updates
          }
        })
        .then(() => resolve());
    });
  }

  addLogoToSlide(deckId, logoURL, slide) {
    let slideId = slide.objectId;

    var requests = [];
    var imageId = "customerLogo";
    var emu4M = {
      magnitude: 4000000,
      unit: "EMU"
    };
    
    requests.push({
      createImage: {
        objectId: imageId,
        url: logoURL,
        elementProperties: {
          pageObjectId: slideId,
          size: {
            height: emu4M,
            width: emu4M
          },
          transform: {
            scaleX: 0.2,
            scaleY: 0.2,
            translateX: 8000000,
            translateY: 100000,
            unit: "EMU"
          }
        }
      }
    });
    

    return new Promise((resolve, reject) => {
      this.batchUpdateDeck(deckId, requests).then(() => {
        resolve();
      });
    });
  }

  addLogoToSlideData(deckId, logoURL, titleSlide, diagramSlide) {
    //let slideId1 = titleSlide.objectId;
    //let slideId2 = "g8083697ea8_0_58";//diagramSlide.objectId;
    var requests = [];
    var imageId = "customerLogo2";
    var emu4M = {
      magnitude: 4000000,
      unit: "EMU"
    };

    //add a request to replace text with logos
    requests.push({
      replaceAllShapesWithImage: {
        imageUrl: logoURL,
        containsText: {
            text: "{{LOGO}}"
        }
    
    }});
    

    /*add a request for placing the customer logo on the title slide
    requests.push({
      createImage: {
        objectId: imageId,
        url: logoURL,
        elementProperties: {
          pageObjectId: slideId1,
          size: {
            height: emu4M,
            width: emu4M
          },
          transform: {
            scaleX: 0.2,
            scaleY: 0.2,
            translateX: 8000000,
            translateY: 100000,
            unit: "EMU"
          }
        }
      }
    });
    */

    /*add a request to place each customer logo on the diagram slide
    requests.push({
      createImage: {
        objectId: "logo3",
        url: logoURL,
        elementProperties: {
          pageObjectId: slideId2,
          size: {
            height: emu4M,
            width: emu4M
          },
          transform: {
            scaleX: 0.05,
            scaleY: 0.05,
            translateX: 5600000,
            translateY: 3460000,
            unit: "EMU"
          }
        }
      }
    });

    requests.push({
      createImage: {
        objectId: "logo4",
        url: logoURL,
        elementProperties: {
          pageObjectId: slideId2,
          size: {
            height: emu4M,
            width: emu4M
          },
          transform: {
            scaleX: 0.05,
            scaleY: 0.05,
            translateX: 6050000,
            translateY: 4450000,
            unit: "EMU"
          }
        }
      }
    });
*/

    return new Promise((resolve, reject) => {
      this.batchUpdateDeck(deckId, requests).then(() => {
        resolve();
      });
    });
  }

  /**
   * Update the slides by replacing text
   * @param  {string} deckId  The ID for the deck to update the text in
   * @param  {array} options  The replacement options
   * @return {Promise}        Promise
   */
  updateSlidesByReplacingText(deckId, options) {
    let replacements = [];
    for (const replacement of options) {
      replacements.push({
        replaceAllText: {
          pageObjectIds: [replacement.slide.objectId],
          containsText: {
            text: replacement.searchString
          },
          replaceText: replacement.replacementString
        }
      });
    }

    return new Promise((resolve, reject) => {
      this.batchUpdateDeck(deckId, replacements).then(() => resolve());
    });
  }

  /**
   * Delete slides of a Google deck
   * @param  {string} deckId   Deck ID
   * @param  {array} slideIds  IDs of the slides to delete from the deck
   * @return {Promise}          promise
   */
  deleteSlides(deckId, slideIds) {
    // Build the delete objects
    let deletions = [];
    for (const slideId of slideIds) {
      deletions.push({
        deleteObject: {
          objectId: slideId
        }
      });
    }

    return new Promise((resolve, reject) => {
      // Just need to pass it through for now
      this.batchUpdateDeck(deckId, deletions).then(() => resolve());
    });
  }
}
