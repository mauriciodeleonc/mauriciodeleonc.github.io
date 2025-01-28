/**
 * COMMENTS / QUESTIONS:
 * 1. Every pre-populated set has a "meta" property, and it contains a "hits"
 * property. I'm not 100% sure what that's for.
 * 2. ContentId "cda8e42d-0cc4-484f-bb5b-b8dd3b8dd496" (The Mandalorian on
 * section 1 - "New to Disney+") is not returning any image.
 * Comparing its images urls with the ones that render below (on the section
 * "Because You Watched Gordon Ramse" and "Trending" it appears the url has
 * an extra 1 at the end of the URL. On a real scenario I would ping the back
 * end team to ask about the issue, inform the PM, and (if required by the project)
 * create a bug ticket to keep track of the issue.
 * Incorret URL: https://prod-ripcut-delivery.disney-plus.net/v1/variant/disney/E7BFFF8CD4E7BA85BFB3439CDF90698213E8134E4CC729A9AFA17A2E1FC665D31
 * Correct URL: https://prod-ripcut-delivery.disney-plus.net/v1/variant/disney/E7BFFF8CD4E7BA85BFB3439CDF90698213E8134E4CC729A9AFA17A2E1FC665D3
 */

//API constants
const HOME_API = "https://cd-static.bamgrid.com/dp-117731241344/home.json";
const DYNAMIC_REF_API = "https://cd-static.bamgrid.com/dp-117731241344/sets/";

//Assets
const DEFAULT_IMAGE = "./assets/default-image.jpg";
const MICKEY_MAGIC = "./assets/mickey-magic.png";

//User's aspect ratio
let screenWidth = screen.width;
let screenHeight = screen.height;
let aspectRatio = screenWidth / screenHeight;
const allowedAspectRatios = ["1.78", "2.29", "0.71", "0.75", "0.67"];

/**
 * Used to store all data related to each tile
 * This data will be used to populate the modal
 */
const tilesData = new Map();

const modalElement = document.getElementById("tile-modal");
const modalContentElement = document.getElementById("tile-modal-content");

/**
 * selectedTile is a value relative to the selectedContainer
 * If we think in terms of arrays, it would be the same as
 * [0][0] (container 0, tile 0);
 */
let selectedTile = 0;
let selectedContainer = 0;
let containersLength = 0;

/**
 * Fetches data from the provided URL and returns
 * its response data.
 * @param {string} url - URL to fetch.
 * @return {object} data - response object from
 * the API call.
 */
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error fetching ${url}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return;
  }
};

/**
 * "Resets" modal content to a clean state to be
 * ready to be populated again when the user selects
 * another tile
 */
const removeModalContent = () => {
  modalContentElement.replaceChildren();
};

/**
 * Sets the modal content with the information of the
 * selected tile
 */
const setModalContent = () => {
  /**
   * If modal is open, return to prevent
   * modal from being populated again
   */
  if (modalElement.style.display === "block") return;

  const container = getCurrentContainer();
  const tiles = getCurrentTiles(container);
  const tileId = tiles[selectedTile].id;

  const { image, text, ratings, releases } = tilesData.get(tileId);
  /**
   * For this take-home assignment I decided to take
   * "hero_tile" and "title_treatment_layer" as the
   * images to use in the modal since they are present
   * on most of the items
   * For those without these properties the modal image
   * defaults to the image already on the tile
   */
  const { hero_tile, title_treatment_layer } = image;
  const { content: title } =
    text.title.full.program?.default ??
    text.title.full.series?.default ??
    text.title.full.collection?.default;
  const hasReleaseYear = releases && releases.length > 0;
  const releaseYear = hasReleaseYear ? releases[0].releaseYear : undefined;
  const hasRating = ratings && ratings.length > 0;
  const rating = hasRating ? ratings[0].value : undefined;

  const modalImageWrapperElement = document.createElement("div");
  modalImageWrapperElement.classList.add("modal-image-wrapper");

  const titleTreatmentLayer =
    title_treatment_layer?.["1.78"]?.program?.default.url ??
    title_treatment_layer?.["1.78"]?.series?.default.url ??
    title_treatment_layer?.["1.78"]?.default?.default.url;

  const heroTile =
    hero_tile?.["1.78"]?.program?.default.url ??
    hero_tile?.["1.78"]?.series?.default.url ??
    hero_tile?.["1.78"]?.default?.default.url;

  const modalHeroImageElement = document.createElement("img");
  modalHeroImageElement.alt = title;

  /**
   * As mentioned above, the image used for the modal is
   * a combination of both the "hero_title" and the
   * "title_treatment_layer", if one of them is not present
   * then the image defaults to whatever image was already
   * used on the tile
   */
  if (!titleTreatmentLayer || !heroTile) {
    const currentTileImage =
      tiles[selectedTile].getElementsByClassName("tile-img")[0];
    modalHeroImageElement.src = currentTileImage.src;
  } else {
    const modalTitleImageElement = document.createElement("img");
    modalTitleImageElement.src = titleTreatmentLayer;
    modalTitleImageElement.classList.add("modal-title-image");
    modalImageWrapperElement.append(modalTitleImageElement);

    modalHeroImageElement.src = heroTile;

    modalTitleImageElement.onerror = () => {
      console.error("Error loading image for tile: ", tileId);
      modalTitleImageElement.src = DEFAULT_IMAGE;
    };

    modalHeroImageElement.onerror = () => {
      console.error("Error loading image for tile: ", tileId);
      modalHeroImageElement.src = DEFAULT_IMAGE;
    };
  }

  modalHeroImageElement.classList.add("modal-hero-image");
  modalImageWrapperElement.append(modalHeroImageElement);

  modalContentElement.append(modalImageWrapperElement);

  const modalContentWrapperElement = document.createElement("div");
  modalContentWrapperElement.classList.add("modal-content-wrapper");

  const modalTitleElement = document.createElement("p");
  modalTitleElement.textContent = title;
  modalTitleElement.classList.add("modal-title");
  modalContentWrapperElement.append(modalTitleElement);

  /**
   * Not all tiles have release years (e.g. collections)
   * so we render it only when present.
   */
  if (hasReleaseYear) {
    const modalReleaseYearElement = document.createElement("p");
    modalReleaseYearElement.textContent = releaseYear;
    modalReleaseYearElement.classList.add("modal-release-year");
    modalContentWrapperElement.append(modalReleaseYearElement);
  }

  /**
   * Not all tiles have ratings (e.g. collections)
   * so we render it only when present.
   */
  if (hasRating) {
    const modalRatingElement = document.createElement("p");
    modalRatingElement.textContent = rating;
    modalRatingElement.classList.add("modal-rating");
    modalContentWrapperElement.append(modalRatingElement);
  }

  modalContentElement.append(modalContentWrapperElement);
};

/**
 * Getter function for obtaining the container with
 * the currently selected tile.
 * @returns {HTMLElement} current container element.
 */
const getCurrentContainer = () => {
  return document.getElementsByClassName("container")[selectedContainer];
};

/**
 * Getter function for obtaining the the currently selected tile.
 * @param {HTMLElement} parentContainerElement - current container element.
 * @returns {HTMLElement} current tile element.
 */
const getCurrentTiles = (parentContainerElement) => {
  if (!parentContainerElement) return;
  return parentContainerElement.getElementsByClassName("tile-wrapper");
};

/**
 * Handles logic for highlighting the tile
 * selected by the user.
 * @param {string} direction - string with values "up",
 * "down", "left", "right".
 */
const changeSelectedTile = (direction) => {
  /**
   * If modal is open, return to prevent
   * users from moving around while looking
   * at the modal.
   */
  if (modalElement.style.display === "block") return;

  let container = getCurrentContainer();
  let tiles = getCurrentTiles(container);

  /**
   * Return if we're out of bounds, or if
   * the current container doesn't have any tiles
   */
  if (
    !container ||
    !tiles ||
    containersLength === 0 ||
    tiles.length === 0 ||
    (selectedTile === 0 && direction === "left") ||
    (selectedTile === tiles.length - 1 && direction === "right") ||
    (selectedContainer === 0 && direction === "up") ||
    (selectedContainer === containersLength - 1 && direction === "down")
  )
    return;

  let currentTile = tiles[selectedTile];
  currentTile.classList.remove("active");

  /**
   * For directions left and right we just add / subtract from
   * the currently selected tile.
   * For directions up and down we add / subtract from the
   * currently selected container, get that container, get
   * its tiles, and reset the currently selected tile to 0
   * (in the future this could be changed to use the relative
   * position of the selected tile with respect of the
   * page it's currently on, this way when a user wants to
   * go 1 tile down, it will truly select the one below the
   * currently selected one, instead of going to the first
   * of the list)
   */
  if (direction === "right") {
    selectedTile += 1;
  } else if (direction === "left") {
    selectedTile -= 1;
  } else if (direction === "up") {
    selectedContainer -= 1;
    container = getCurrentContainer();
    tiles = getCurrentTiles(container);
    selectedTile = 0;
  } else if (direction === "down") {
    selectedContainer += 1;
    container = getCurrentContainer();
    tiles = getCurrentTiles(container);
    selectedTile = 0;
  }

  currentTile = tiles[selectedTile];

  //Moves the selected tile into view
  currentTile?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  currentTile?.classList.add("active");
};

/**
 * Throttles function which helps prevent users
 * from scrolling faster than the page fetches
 * new containers / tiles.
 * @param {Function} callback - Function to throttle.
 * @param {number} limit - Time interval in milliseconds
 * to wait before executing function again.
 * @returns {Function} - Throttled function.
 */
const throttle = (callback, limit) => {
  let lastRan = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastRan >= limit) {
      callback(...args);
      lastRan = now;
    }
  };
};

const throttledChangeSelectedTile = throttle(changeSelectedTile, 350);

/**
 * Function for handling the key selected by the user.
 * This emulates a TV controller and its buttons.
 * @param {event} e - Event containing the key pressed.
 */
const handleKeyDown = (e) => {
  const key = e.key;
  switch (key) {
    case "ArrowRight":
      throttledChangeSelectedTile("right");
      break;
    case "ArrowLeft":
      throttledChangeSelectedTile("left");
      break;
    case "ArrowUp":
      throttledChangeSelectedTile("up");
      break;
    case "ArrowDown":
      throttledChangeSelectedTile("down");
      break;
    case "Enter":
      /**
       * We have to populate data first and then render it,
       * that way the modal will render with all of its
       * content, improving UX
       */
      setModalContent();
      modalElement.style.display = "block";
      modalElement.setAttribute("aria-hidden", "false");
      modalElement.focus();
      break;
    case "Backspace":
    case "Escape":
      /**
       * We remove the modal from the screen first
       * and then remove its children / data, that way
       * we prevent the layout / UI from jumping around,
       * improving UX
       */
      modalElement.style.display = "none";
      modalElement.setAttribute("aria-hidden", "true");
      removeModalContent();
      break;
    default:
      break;
  }
};

/**
 * Renders containers and appends them to the passed parent element.
 * @param {array} containers - Array containing all containers
 * and their data.
 * @param {HTMLElement} parentElement - Element that will
 * be used to append the containers.
 */
const renderContainers = (containers, parentElement) => {
  if (!parentElement) {
    console.error("Parent element is missing");
    return;
  }

  if (!Array.isArray(containers) || containers.length === 0) {
    console.error("No containers to render");
    return;
  }

  containers.forEach((container) => {
    const containerData = container.set;

    const containerElement = document.createElement("div");
    containerElement.classList.add("container");

    const containerTitle = containerData.text.title.full.set.default.content;
    const containerTitleElement = document.createElement("p");
    containerTitleElement.classList.add("container-title");
    containerTitleElement.textContent = containerTitle;

    containerElement.id = containerData.setId ?? containerData.refId;
    containerElement.append(containerTitleElement);
    parentElement.append(containerElement);

    /**
     * If the container has items it means it's already
     * prepopulated with data.
     */
    if (containerData.hasOwnProperty("items") && containerData.items) {
      renderContainerItems(containerElement, containerData);

      // Mark container as populated
      containerElement.dataset.populated = "true";
    }
  });
};

/**
 * Preselects the first tile on the first container for the user.
 * @param {HTMLElement} parentElement - Element used as reference
 * for the first container on the screen.
 */
const preselectFirstTile = (parentElement) => {
  const containers = parentElement.getElementsByClassName("container");
  const items = containers[0].getElementsByClassName("items-wrapper");

  const preselectedTile = items[0].firstChild;
  preselectedTile.classList.add("active");
};

/**
 * Creates the tiles inside a container and adds them to it
 * @param {HTMLElement} containerElement - The container element to add items to
 * @param {object} containerData - The data used to create the items.
 */
const renderContainerItems = (containerElement, containerData) => {
  const containerItemsElement = document.createElement("div");
  containerItemsElement.classList.add("items-wrapper");

  const containerItems = containerData.items;
  containerItems.forEach((containerItem) => {
    const { text, image, contentId, collectionId } = containerItem;

    const tileId = contentId ?? collectionId;

    tilesData.set(tileId, containerItem);

    const tileWrapperElement = document.createElement("div");
    tileWrapperElement.classList.add("tile-wrapper");
    tileWrapperElement.id = tileId;

    /**
     * For this take-home assignment I decided to make
     * the tile card a button because it opens a modal
     * on the same page, however on a real scenario it
     * could be created with an <a> tag to redirect users
     * to that show's / movie's information page.
     */
    const tileButtonElement = document.createElement("button");
    tileButtonElement.classList.add("tile-button");

    const { content: title } =
      text.title.full.program?.default ??
      text.title.full.series?.default ??
      text.title.full.collection?.default;

    const tileImgElement = document.createElement("img");
    tileImgElement.classList.add("tile-img");
    tileImgElement.alt = title;

    tileImgElement.onerror = () => {
      console.error("Error loading image for tile: ", tileId);
      tileImgElement.src = DEFAULT_IMAGE;
    };

    try {
      if (allowedAspectRatios.includes(aspectRatio)) {
        tileImgElement.src =
          image.tile[aspectRatio]?.program?.default.url ??
          image.tile[aspectRatio]?.series?.default.url ??
          image.tile[aspectRatio]?.default?.default.url;
      } else {
        tileImgElement.src =
          image.tile["1.78"]?.program?.default.url ??
          image.tile["1.78"]?.series?.default.url ??
          image.tile["1.78"]?.default?.default.url;
      }
    } catch (error) {
      tileImgElement.src = DEFAULT_IMAGE;
    }

    /**
     * TODO: Disney Magic idea for future improvements.
     * Different Disney characters could randomly
     * pop behind / in front of the tiles with
     * some animation.
     */
    const mickeyElement = document.createElement("img");
    mickeyElement.src = MICKEY_MAGIC;
    mickeyElement.classList.add("mickey");

    tileButtonElement.append(tileImgElement);
    tileWrapperElement.append(tileButtonElement);
    tileWrapperElement.append(mickeyElement);
    containerItemsElement.append(tileWrapperElement);
  });

  containerElement.appendChild(containerItemsElement);
};

/**
 * Fetches and populates dynamic container data as it comes into view
 */
const observeDynamicContainers = () => {
  const containers = document.getElementsByClassName("container");

  const observer = new IntersectionObserver(
    async (entries, observerInstance) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const containerElement = entry.target;
          const containerId = containerElement.id;

          if (containerElement.dataset.populated === "true") {
            observerInstance.unobserve(containerElement);
            continue;
          }

          try {
            const responseData = await fetchData(
              `${DYNAMIC_REF_API}${containerId}.json`
            );
            const containerData =
              responseData.data.CuratedSet ??
              responseData.data.PersonalizedCuratedSet ??
              responseData.data.TrendingSet;

            renderContainerItems(containerElement, containerData);

            containerElement.dataset.populated = "true";

            observerInstance.unobserve(containerElement);
          } catch (error) {
            console.error(`Error fetching container: ${containerId}`, error);
          }
        }
      }
    },
    { root: null, rootMargin: "0px", threshold: 0.1 }
  );

  for (let containerElement of containers) {
    observer.observe(containerElement);
  }
};

window.onload = async () => {
  /**
   * The expected behavior of the app is to
   * work as if it was controlled using a TV
   * controller, which we're emulating here
   * by listening for keydown events.
   * (We opt for keydown rather than keypress
   * because keypress is now deprecated).
   * See [this](https://developer.mozilla.org/en-US/docs/Web/API/Element/keypress_event)
   * for more information.
   */
  document.addEventListener("keydown", handleKeyDown);

  try {
    //Fetch data to render containers and titles
    const containersData = await fetchData(HOME_API);

    if (containersData) {
      /**
       * Although other properties (if not all) like "type", "videoArt",
       * or "callToAction" might be used on the real Disney+ website, for this
       * take-home assignment I decided to focus on these properties.
       */
      const { text, containers } = containersData.data.StandardCollection;
      containersLength = containers.length;

      /**
       * Used for changing the content of the <title> tag
       * and the <html lang/> property.
       */
      const { content: pageTitle, language } =
        text.title.full.collection.default;
      if (pageTitle) document.title = `${pageTitle} | Disney+`;
      if (language) document.lang = language;

      //Populate and render containers
      const containersWrapperElement =
        document.getElementById("containers-wrapper");
      renderContainers(containers, containersWrapperElement);
      observeDynamicContainers();

      /**
       * After rendering all containers we should "pre-select"
       * the first tile for the user.
       */
      preselectFirstTile(containersWrapperElement);
    }
  } catch (error) {
    console.error(error);
  }
};
