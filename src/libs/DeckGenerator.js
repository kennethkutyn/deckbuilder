export const deckBuilderUpdates = {
  STARTED:            "started",
  ACCESSING_NEW_DECK: "accessing new deck",
  CONFIGURING_SLIDES: "configuring slides",
  DECK_SELECTED:      "deck selected",
  FINISHED:           "finished"
}

export default class DeckGenerator {

  constructor(googleHelper, updateListener, folderId) {
    this.googleHelper   = googleHelper;
    this.updateListener = updateListener || console.log;
    this.folderId       = folderId
  }
  
  /**
   * Handle the "generate" button click and start processing the new
   *   presentation with google
   * @param  {object} values        The values returned by the form
   * @param  {array} originalDecks  The original list of decks from the
   *                                deckbuilder
   * @return {null}               
   */
  generate(values, chosenDecks, deletedDecks) {
    // Send update
    this.updateListener(deckBuilderUpdates.STARTED);

    // Track decks via analytics
    for(const deck of chosenDecks) {
      this.updateListener(deckBuilderUpdates.DECK_SELECTED, { deck });
    }

    // Get relevant variables from the values object
    const customerName  = values.customer_name;

    // Generate deck filename
    const filename = this.generateFilename(customerName);

    // Copy the master deck into the destination folder
    this.googleHelper.copyMasterDeck(filename, this.folderId)
    .then((fileId) => {

      this.updateListener(deckBuilderUpdates.ACCESSING_NEW_DECK, { fileId });

      // Get the presentation slides
      this.googleHelper.getPresentation(fileId)
      .then((masterDeck) => {

        this.updateListener(deckBuilderUpdates.CONFIGURING_SLIDES);

        // Get the slides out of this presentation
        const slides = masterDeck.slides;

        // Update the title slide with text from our DeckBuilder
        this.updateTitleAndAgendaSlides(fileId, slides, chosenDecks, values);

        // Add the customer logo
        this.addCustomerLogoToDeck(fileId, values.logo, slides);

        // Check if we need to delete any slides
        if(deletedDecks.length > 0) {
          // Delete unnecessary slides
          this.deleteSlides(fileId, slides, deletedDecks)
          .then(() => { 
            // Call to finish
            this.updateListener(deckBuilderUpdates.FINISHED);
          });
        }
        else {
          // No slides need to be deleted, we can just finish
          this.updateListener(deckBuilderUpdates.FINISHED);
        }

      });

    });
  }

  /**
   * Generate a filename for the new deck
   * @param  {string} prepend The text to be prepended onto the filename
   * @return {string}         The new filename
   */
  generateFilename(prepend) {
    return prepend + " | Optimizely Overview";
  }

  /**
   * Update the title and agenda slides in the new presentation deck
   * @param  {string} fileId        The presentation's file id
   * @param  {array}  slides        A list of the slides in the presentation
   *                                deck
   * @param  {object} values        Values from the deckbuilder form that was
   *                                submitted
   * @param  {array}  originalDecks The original decks from our config file
   * @return {Promise}              Gets returned when the updates are made      
   */
  updateTitleAndAgendaSlides(fileId, slides, chosenDecks, values) {
    // Generate the agenda text
    let agendaInt   = 1;
    let agendaText  = "";
    for(const deck of chosenDecks) {
      agendaText += agendaInt + ". " + deck.agendaTitle + "\n";
      agendaInt++;
    }

    // Generate the replacements we want to implement
    const replacements = [
      {
        slide: slides[0],
        searchString: "COMPANYNAME",
        replacementString: values.customer_name
      },
      {
        slide: slides[0],
        searchString: "AEName",
        replacementString: values.ae_name
      },
      {
        slide: slides[0],
        searchString: "SENAME",
        replacementString: values.se_name
      },
      {
        slide: slides[1],
        searchString: "AGENDAHERE",
        replacementString: agendaText
      }
    ];

    // Perform the replacements
    this.googleHelper.updateSlidesByReplacingText(fileId, replacements);
  }

  addCustomerLogoToDeck(deckId, logoURL, slides) {
    // Find the correct slide
    let slide = slides[0];

    // Add it
    this.googleHelper.addLogoToSlide(deckId, logoURL, slide);
  }

  /**
   * Delete the slides that weren't chosen by the user
   * @param  {string}  fileId        The ID of the presentation deck that has been generated
   * @param  {array}   originalDecks The array of decks that we pulled from config
   * @param  {array}   chosenDecks   The list of decks that the user has chosen
   * @return {Promise}               A promise when the requests complete
   */
  deleteSlides(fileId, slides, deletedDecks) {
    return new Promise((resolve, reject) => {
      // Get the list of deletions - this can go straight into the request
      const deletions = this.generateDeletions(deletedDecks, slides)

      // Delete the decks
      this.googleHelper.deleteSlides(fileId, deletions)
      .then(() => resolve());
    });
  }

  /**
   * Generate array of slides to be deleted
   * @param  {array} originalDecks The original list of decks that have the
   *   offsets and slide lengths in them
   * @param  {array} chosenDecks   The list of decks that have been chosen by
   *   the user
   * @param  {array} slides        The slides from the new deck we retrieved
   *   from the Google API (this will have all of the slide ids in it for us
   *   to record)
   * @return {array}               Array of objects which will form the
   *   request to batch delete slides from the presentation 
   */
  generateDeletions(deletedDecks, slides) {
    // Create variable to store list of deletions
    let deletions = [];

    // Loop through all the original decks to see which ones we need to delete.
    for(const deckToDelete of deletedDecks) {
      // Start at the current deck's offset in the master deck 
      let currOffset = deckToDelete.offset;

      // Loop through each subsequent slide
      for(var j = 0; j < deckToDelete.slides; j++) {
        // Get the slide
        let slide = slides[currOffset];

        // Get the slide object id
        let objectId = slide.objectId;

        // Add it to be deleted
        deletions.push(objectId);

        // Increment the offset
        currOffset++;
      }
    }
    return deletions;
  }

}