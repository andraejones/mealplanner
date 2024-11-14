class MealPlanner {
  constructor() {
    this.emptyListMessages = [
      "Empty list? Let's map out your week of deliciousness!",
      "Your menu's a blank canvas - time to paint it with tasty meals!",
      "Make Future You happy - plan your week of yummy eats now!",
      "A week of great meals starts with a plan. Let's get cooking!",
      "Your stomach called from Friday - it wants to know what's for dinner!",
      "Planning meals today means no 'what's for dinner?' headaches tomorrow!",
      "Ready to turn 'what should we eat?' into 'what shall we eat first?'",
      "Skip the weeknight scramble - let's plan your menu masterpiece!",
      "Turn hangry into happy - plan your week of meals!",
      "Future You will thank Present You for planning this week's feasts!",
      "Meal planning mode: activated! Your taste buds are standing by...",
      "Think of this as your week's food story - let's write a tasty one!",
    ];

    this.storageManager = new StorageManager();
    this.initialize();
    this.currentFilter = "all";
    this.mealGridFilter = null;
  }

  async initialize() {
    await this.storageManager.initialize();
    await this.loadData();

    // Initialize meals if they don't exist
    if (!this.meals) {
      this.meals = {
        Sunday: { breakfast: [], lunch: [], dinner: [] },
        Monday: { breakfast: [], lunch: [], dinner: [] },
        Tuesday: { breakfast: [], lunch: [], dinner: [] },
        Wednesday: { breakfast: [], lunch: [], dinner: [] },
        Thursday: { breakfast: [], lunch: [], dinner: [] },
        Friday: { breakfast: [], lunch: [], dinner: [] },
        Saturday: { breakfast: [], lunch: [], dinner: [] },
        Snacks: { snack: [] },
      };
    }

    // Ensure Snacks structure exists
    if (!this.meals.Snacks || !this.meals.Snacks.snack) {
      this.meals.Snacks = { snack: [] };
    }

    this.showCreatedMeals = false;
    this.initializeEventListeners();
    this.initializeSelects();
    this.initializeTabs();
    this.renderMealGrid();
    this.renderMealLibrary();
    this.attachIngredientEventListeners();
    this.currentEditIndex = null;
    this.initializeImportExport();
    this.updateShoppingList();
  }

  async loadData() {
    // First try to load from Gist if credentials exist
    if (this.storageManager.useGist) {
      try {
        const data = await this.storageManager.loadFromGist();
        if (data) {
          this.meals = data.mealPlan;
          this.mealLibrary = data.mealLibrary;
          // Also update local storage as backup
          localStorage.setItem("mealPlan", JSON.stringify(this.meals));
          localStorage.setItem("mealLibrary", JSON.stringify(this.mealLibrary));
          console.log("Data loaded from Gist successfully");
          return;
        }
      } catch (error) {
        console.error("Failed to load from Gist:", error);
        alert("Failed to load from Gist. Loading from local storage instead.");
      }
    }

    // Fall back to local storage if Gist fails or isn't configured
    console.log("Loading from local storage");
    this.meals = this.loadMeals();
    this.mealLibrary = this.loadMealLibrary();
  }

  loadMeals() {
    const savedMeals = localStorage.getItem("mealPlan");
    let meals = savedMeals
      ? JSON.parse(savedMeals)
      : {
          Sunday: { breakfast: [], lunch: [], dinner: [] },
          Monday: { breakfast: [], lunch: [], dinner: [] },
          Tuesday: { breakfast: [], lunch: [], dinner: [] },
          Wednesday: { breakfast: [], lunch: [], dinner: [] },
          Thursday: { breakfast: [], lunch: [], dinner: [] },
          Friday: { breakfast: [], lunch: [], dinner: [] },
          Saturday: { breakfast: [], lunch: [], dinner: [] },
          Snacks: { snack: [] },
        };

    // Ensure Snacks day has snack array (for backward compatibility)
    if (!meals.Snacks || !meals.Snacks.snack) {
      meals.Snacks = { snack: [] };
    }

    return meals;
  }

  loadMealLibrary() {
    const savedMeals = localStorage.getItem("mealLibrary");
    return savedMeals ? JSON.parse(savedMeals) : [];
  }

  saveMeals() {
    localStorage.setItem("mealPlan", JSON.stringify(this.meals));
    this.storageManager.saveToGist(this.meals, this.mealLibrary);
  }

  saveMealLibrary() {
    localStorage.setItem("mealLibrary", JSON.stringify(this.mealLibrary));
    this.storageManager.saveToGist(this.meals, this.mealLibrary);
  }

  initializeEventListeners() {
    document.getElementById("mealForm").addEventListener("submit", (e) => {
      e.preventDefault();
      this.addToPlan();
    });

    document
      .getElementById("mealLibraryForm")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.addToLibrary();
      });

    document.getElementById("mealTypeSelect").addEventListener("change", () => {
      this.updateMealOptions();
    });

    document.getElementById("toggleMeals").addEventListener("change", (e) => {
      this.showCreatedMeals = e.target.checked;
      this.renderMealLibrary();
    });

    // Add initial ingredient row when the form is ready
    this.addIngredientRow();

    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.storageManager.updateSettings();
    });
  }

  attachIngredientEventListeners() {
    const addIngredientButton = document.getElementById("addIngredient");
    addIngredientButton.addEventListener("click", () => {
      const currentCount = document.querySelectorAll(".ingredient-item").length;
      this.addIngredientRow({}, currentCount);
    });

    document
      .getElementById("ingredientsList")
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-ingredient")) {
          e.target.parentElement.remove();
        }
      });
  }

  addIngredientRow(ingredient = {}, index) {
    const ingredientsList = document.getElementById("ingredientsList");
    const ingredientItem = document.createElement("div");
    ingredientItem.className = "ingredient-item";

    ingredientItem.innerHTML = `
      <input 
        type="text" 
        class="ingredient-name" 
        id="ingredientName_${index}"
        name="ingredientName_${index}"
        placeholder="Ingredient Name" 
        value="${ingredient.name || ""}"
        required 
      />
      <input 
        type="number" 
        class="ingredient-quantity" 
        id="ingredientQuantity_${index}"
        name="ingredientQuantity_${index}"
        placeholder="Quantity" 
        value="${ingredient.quantity || ""}"
        min="0" 
        step="any" 
        required 
      />
      <select 
        class="ingredient-unit" 
        id="ingredientUnit_${index}"
        name="ingredientUnit_${index}"
        required
      >
        <option value="" disabled ${
          !ingredient.unit ? "selected" : ""
        }>Unit</option>
        <option value="tsp" ${
          ingredient.unit === "tsp" ? "selected" : ""
        }>teaspoon (tsp)</option>
        <option value="tbsp" ${
          ingredient.unit === "tbsp" ? "selected" : ""
        }>tablespoon (tbsp)</option>
        <option value="cup" ${
          ingredient.unit === "cup" ? "selected" : ""
        }>cup</option>
        <option value="oz" ${
          ingredient.unit === "oz" ? "selected" : ""
        }>ounces (oz)</option>
        <option value="lb" ${
          ingredient.unit === "lb" ? "selected" : ""
        }>pounds (lb)</option>
        <option value="pkg" ${
          ingredient.unit === "pkg" ? "selected" : ""
        }>packages (pkg)</option>
        <option value="unit" ${
          ingredient.unit === "unit" ? "selected" : ""
        }>units</option>
      </select>
      <button 
        type="button" 
        class="btn btn-danger btn-sm remove-ingredient"
        id="removeIngredient_${index}"
        name="removeIngredient_${index}"
      >×</button>
    `;

    ingredientsList.appendChild(ingredientItem);
  }

  addToPlan() {
    const day = document.getElementById("daySelect").value;
    const mealType = document.getElementById("mealTypeSelect").value;
    const mealSelect = document.getElementById("mealSelect");
    const selectedMealName = mealSelect.value;

    if (!selectedMealName) {
      alert("Please select a meal");
      return;
    }

    const selectedMeal = this.mealLibrary.find(
      (meal) => meal.name === selectedMealName
    );

    if (selectedMeal) {
      if (!this.meals[day][mealType].includes(selectedMealName)) {
        this.meals[day][mealType].push(selectedMealName);
        this.saveMeals();
        this.renderMealGrid();
        this.updateShoppingList();

        // Reset meal select to default option
        mealSelect.value = "";
      } else {
        alert("This meal is already planned for this time");
      }
    }
  }

  removeMeal(day, mealType, mealName) {
    this.meals[day][mealType] = this.meals[day][mealType].filter(
      (meal) => meal !== mealName
    );
    this.saveMeals();
    this.renderMealGrid();
  }

  addToLibrary() {
    const mealName = document.getElementById("mealNameInput").value.trim();
    const mealTypeCheckboxes = document.querySelectorAll(
      'input[name="mealType"]:checked'
    );
    const ingredientItems = document.querySelectorAll(".ingredient-item");
    const recipeInstructions = document
      .getElementById("recipeInstructions")
      .value.trim();

    if (!mealName) {
      alert("Please enter a meal name");
      return;
    }

    if (mealTypeCheckboxes.length === 0) {
      alert("Please select at least one meal type");
      return;
    }

    if (ingredientItems.length === 0) {
      alert("Please add at least one ingredient");
      return;
    }

    const categories = Array.from(mealTypeCheckboxes).map((cb) => cb.value);

    try {
      const ingredients = Array.from(ingredientItems).map((item) => {
        const name = item.querySelector(".ingredient-name").value.trim();
        const quantity = parseFloat(
          item.querySelector(".ingredient-quantity").value
        );
        const unit = item.querySelector(".ingredient-unit").value;

        if (!name || isNaN(quantity) || !unit) {
          throw new Error("Please fill in all ingredient fields");
        }

        return { name, quantity, unit };
      });

      const meal = {
        name: mealName,
        categories,
        ingredients,
        instructions: recipeInstructions,
      };

      if (this.currentEditIndex !== null) {
        // Update existing meal
        this.mealLibrary[this.currentEditIndex] = meal;
        this.currentEditIndex = null;
      } else {
        // Check for duplicate meal names
        if (
          this.mealLibrary.some(
            (m) => m.name.toLowerCase() === mealName.toLowerCase()
          )
        ) {
          alert("A meal with this name already exists");
          return;
        }
        // Add new meal
        this.mealLibrary.push(meal);
      }

      this.saveMealLibrary();
      this.renderMealLibrary();
      this.updateMealOptions();

      // Reset the form
      document.getElementById("mealLibraryForm").reset();
      document.getElementById("ingredientsList").innerHTML = "";
      this.addIngredientRow();
      document.getElementById("saveMealButton").textContent = "Save Meal";
    } catch (error) {
      alert(error.message);
    }
  }

  removeFromLibrary(mealName) {
    // Find the meal in the library by name
    const index = this.mealLibrary.findIndex((meal) => meal.name === mealName);
    if (index === -1) return;

    // If we're currently editing this meal, reset the form
    if (this.currentEditIndex === index) {
      document.getElementById("mealLibraryForm").reset();
      document.getElementById("ingredientsList").innerHTML = "";
      this.addIngredientRow();
      document.getElementById("saveMealButton").textContent = "Save Meal";
      this.currentEditIndex = null;
    }

    // Remove from library
    this.mealLibrary.splice(index, 1);

    // Remove from planned meals
    Object.keys(this.meals).forEach((day) => {
      Object.keys(this.meals[day]).forEach((mealType) => {
        this.meals[day][mealType] = this.meals[day][mealType].filter(
          (meal) => meal !== mealName
        );
      });
    });

    // Save both meal library and planned meals
    this.saveMealLibrary();
    this.saveMeals();

    // Update both displays
    this.renderMealLibrary();
    this.renderMealGrid();
  }

  renderMealGrid() {
    const grid = document.getElementById("mealGrid");
    const mealPlanContent = document.getElementById("mealPlan");
    grid.innerHTML = "";

    const daysOrder = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Snacks",
    ];

    // Create a container for the grid
    const gridContainer = document.createElement("div");
    gridContainer.className = "meal-grid";

    daysOrder.forEach((day) => {
      const dayMeals = this.meals[day];

      // Skip days that don't contain filtered meals
      if (this.mealGridFilter) {
        const hasFilteredMeal = Object.values(dayMeals).some((meals) =>
          meals.some((meal) => this.mealGridFilter.includes(meal))
        );
        if (!hasFilteredMeal) return;
      }

      const dayCard = document.createElement("div");
      dayCard.className = "day-card";

      // Determine which meal types to show based on the day
      const mealTypes =
        day === "Snacks" ? ["snack"] : ["breakfast", "lunch", "dinner"];

      dayCard.innerHTML = `
        <h2>${day}</h2>
        <div class="meal-list">
          ${mealTypes
            .map(
              (mealType) => `
              <div class="meal-item">
                <div class="meal-details">
                  <strong>${
                    mealType.charAt(0).toUpperCase() + mealType.slice(1)
                  }:</strong>
                  ${
                    dayMeals[mealType] && dayMeals[mealType].length > 0
                      ? dayMeals[mealType]
                          .map((meal) => {
                            const mealData = this.mealLibrary.find(
                              (m) => m.name === meal
                            );
                            const ingredients = mealData
                              ? mealData.ingredients
                                  .map(
                                    (ing) =>
                                      `<li>${ing.quantity} ${ing.unit} ${ing.name}</li>`
                                  )
                                  .join("")
                              : "";

                            return `
                              <div class="planned-meal">
                                <div class="meal-header">
                                  <button class="btn btn-danger btn-sm" onclick="mealPlanner.removeMeal('${day}', '${mealType}', '${meal}')">×</button>
                                  <span class="meal-name" onclick="mealPlanner.toggleRecipe(this)">${meal}</span>
                                </div>
                                <div class="recipe-details">
                                  <strong>Ingredients:</strong>
                                  <ul class="recipe-ingredients">
                                    ${ingredients}
                                  </ul>
                                  ${
                                    mealData?.instructions
                                      ? `
                                    <strong>Instructions:</strong>
                                    <div class="recipe-instructions">${mealData.instructions}</div>
                                  `
                                      : ""
                                  }
                                </div>
                              </div>
                            `;
                          })
                          .join("")
                      : "No meals planned"
                  }
                </div>
              </div>
            `
            )
            .join("")}
        </div>
        ${
          Object.values(dayMeals).some((meals) => meals.length > 0)
            ? `<div class="day-card-actions">
                 <button class="btn btn-danger" onclick="mealPlanner.clearDay('${day}')">
                   ${day === "Snacks" ? "Clear Snacks" : "Clear Day"}
                 </button>
               </div>`
            : ""
        }
      `;

      gridContainer.appendChild(dayCard);
    });

    // Add the grid container to the main grid element
    grid.appendChild(gridContainer);

    // Add clear filter button if filter is active
    if (this.mealGridFilter) {
      const clearFilterBtn = document.createElement("div");
      clearFilterBtn.className = "clear-filter-container";
      clearFilterBtn.innerHTML = `
        <button class="btn btn-secondary" onclick="mealPlanner.clearMealFilter()">
          Clear Filter
        </button>
      `;
      grid.appendChild(clearFilterBtn);
    }

    this.updateShoppingList();
  }

  toggleRecipe(element) {
    const plannedMeal = element.closest(".planned-meal");
    const recipeDetails = plannedMeal.querySelector(".recipe-details");
    const allRecipeDetails = document.querySelectorAll(".recipe-details");

    // Close all other expanded recipes
    allRecipeDetails.forEach((details) => {
      if (details !== recipeDetails) {
        details.classList.remove("expanded");
      }
    });

    // Toggle current recipe
    recipeDetails.classList.toggle("expanded");
  }

  clearDay(day) {
    Object.keys(this.meals[day]).forEach((mealType) => {
      this.meals[day][mealType] = [];
    });
    this.saveMeals();
    this.renderMealGrid();
  }

  renderMealLibrary() {
    const container = document.getElementById("mealsContainer");
    const filterSection = document.querySelector(".meal-filter");
    container.innerHTML = "";

    if (!this.showCreatedMeals) {
      container.style.display = "none";
      filterSection.style.display = "none";
      return;
    }

    container.style.display = "grid";
    filterSection.style.display = "block";

    // Initialize filter buttons
    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-btn").forEach((btn) => {
          btn.classList.remove("active");
        });
        e.target.classList.add("active");
        this.currentFilter = e.target.dataset.filter;
        this.renderMealLibrary();
      });
    });

    // Initialize search functionality
    const searchInput = document.getElementById("mealSearch");
    if (!searchInput.hasEventListener) {
      searchInput.addEventListener("input", () => {
        this.renderMealLibrary();
      });
      searchInput.hasEventListener = true;
    }

    let sortedMeals = [...this.mealLibrary].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    // Apply category filter
    if (this.currentFilter !== "all") {
      sortedMeals = sortedMeals.filter((meal) =>
        meal.categories.includes(this.currentFilter)
      );
    }

    // Apply search filter
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
      sortedMeals = sortedMeals.filter((meal) => {
        // Search in meal name
        if (meal.name.toLowerCase().includes(searchTerm)) {
          return true;
        }
        // Search in ingredients
        return meal.ingredients.some((ingredient) =>
          ingredient.name.toLowerCase().includes(searchTerm)
        );
      });
    }

    sortedMeals.forEach((meal) => {
      const mealElement = document.createElement("div");
      mealElement.className = "meal-item-card";
      mealElement.innerHTML = `
        <div class="meal-content">
          <div class="meal-name">${meal.name}</div>
          <div class="meal-category">${meal.categories.join(", ")}</div>
          <div class="ingredients-list">
            ${meal.ingredients
              .map((ing) => `• ${ing.quantity} ${ing.unit} ${ing.name}`)
              .join("<br>")}
          </div>
          ${
            meal.instructions
              ? `
            <div class="instructions-preview">
              <button class="btn btn-sm btn-secondary toggle-instructions">Show Instructions</button>
              <div class="recipe-instructions hidden">
                ${meal.instructions}
              </div>
            </div>
          `
              : ""
          }
        </div>
        <div class="meal-actions">
          <button class="btn btn-primary btn-sm" onclick="mealPlanner.editMeal('${
            meal.name
          }')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="mealPlanner.removeFromLibrary('${
            meal.name
          }')">Remove</button>
        </div>
      `;

      // Add event listener for instructions toggle
      const toggleBtn = mealElement.querySelector(".toggle-instructions");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
          const instructions = e.target.nextElementSibling;
          instructions.classList.toggle("hidden");
          e.target.textContent = instructions.classList.contains("hidden")
            ? "Show Instructions"
            : "Hide Instructions";
        });
      }

      container.appendChild(mealElement);
    });

    // Show message if no meals match the filter and search
    if (sortedMeals.length === 0) {
      container.innerHTML = `
        <div class="empty-list-message">
          ${
            searchTerm
              ? `No meals found matching "${searchTerm}"`
              : `No ${
                  this.currentFilter === "all" ? "" : this.currentFilter
                } meals found`
          }
        </div>
      `;
    }
  }

  editMeal(mealName) {
    // Find the meal in the library by name
    const index = this.mealLibrary.findIndex((meal) => meal.name === mealName);
    if (index === -1) return;

    const mealToEdit = this.mealLibrary[index];
    this.currentEditIndex = index;

    // Scroll to the form
    document
      .getElementById("mealLibraryForm")
      .scrollIntoView({ behavior: "smooth" });

    // Populate the form with existing meal data
    document.getElementById("mealNameInput").value = mealToEdit.name;
    document.getElementById("recipeInstructions").value =
      mealToEdit.instructions || "";

    // Clear existing ingredient rows
    document.getElementById("ingredientsList").innerHTML = "";

    // Populate ingredients
    mealToEdit.ingredients.forEach((ingredient, index) => {
      this.addIngredientRow(ingredient, index);
    });

    // Set checked checkboxes for meal types
    const mealTypeCheckboxes = document.querySelectorAll(
      'input[name="mealType"]'
    );
    mealTypeCheckboxes.forEach((checkbox) => {
      checkbox.checked = mealToEdit.categories.includes(checkbox.value);
    });

    // Change the submit button text to 'Update Meal'
    document.getElementById("saveMealButton").textContent = "Update Meal";
  }

  updateMealOptions() {
    const mealType = document.getElementById("mealTypeSelect").value;
    const mealSelect = document.getElementById("mealSelect");

    mealSelect.innerHTML = '<option value="">-- Select a Meal --</option>';

    const filteredMeals = this.mealLibrary.filter((meal) =>
      meal.categories.includes(mealType)
    );

    // Sort the filtered meals alphabetically by name
    filteredMeals.sort((a, b) => a.name.localeCompare(b.name));

    filteredMeals.forEach((meal) => {
      const option = document.createElement("option");
      option.value = meal.name;
      option.textContent = meal.name;
      mealSelect.appendChild(option);
    });
  }

  updateShoppingList() {
    const shoppingList = document.getElementById("shoppingItems");
    const ingredientMap = {};

    Object.values(this.meals).forEach((dayMeals) => {
      Object.values(dayMeals).forEach((mealNames) => {
        const mealsArray = Array.isArray(mealNames) ? mealNames : [];
        mealsArray.forEach((mealName) => {
          if (!mealName) return;
          const meal = this.mealLibrary.find((m) => m.name === mealName);
          if (meal) {
            meal.ingredients.forEach(({ name, quantity, unit }) => {
              const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
              if (!ingredientMap[key]) {
                ingredientMap[key] = {
                  quantity: 0,
                  meals: new Set(),
                  name,
                  unit,
                };
              }
              ingredientMap[key].quantity += quantity;
              ingredientMap[key].meals.add(meal.name);
            });
          }
        });
      });
    });

    const shoppingItems = Object.values(ingredientMap).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    if (shoppingItems.length === 0) {
      shoppingList.innerHTML = `
        <li class="empty-list-message">
          ${this.getRandomEmptyMessage()}
        </li>
      `;
    } else {
      shoppingList.innerHTML = shoppingItems
        .map((item) => {
          // Properly escape the meals array for the onclick attribute
          const mealsJSON = JSON.stringify(Array.from(item.meals))
            .replace(/"/g, "&quot;")
            .replace(/'/g, "\\'");

          return `
              <li>
                <div class="shopping-item" onclick="mealPlanner.filterMealsByIngredient('${
                  item.name
                }', '${mealsJSON}')">
                  <span class="ingredient-detail">${item.quantity} ${
            item.unit
          } ${item.name}</span>
                  <span class="meal-sources">Used in: ${Array.from(
                    item.meals
                  ).join(" | ")}</span>
                </div>
              </li>
            `;
        })
        .join("");
    }
  }

  initializeImportExport() {
    document
      .getElementById("exportMeals")
      .addEventListener("click", () => this.exportMeals());
    document.getElementById("importMealsBtn").addEventListener("click", () => {
      document.getElementById("importMeals").click();
    });
    document
      .getElementById("importMeals")
      .addEventListener("change", (e) => this.importMeals(e));
  }

  exportMeals() {
    const data = JSON.stringify(this.mealLibrary, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meal-library.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  importMeals(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedMeals = JSON.parse(e.target.result);
        if (!Array.isArray(importedMeals)) {
          throw new Error("Invalid meal library format - expected an array");
        }

        // Validate meal structure
        const isValidMeal = (meal) => {
          return (
            meal.name &&
            Array.isArray(meal.categories) &&
            Array.isArray(meal.ingredients) &&
            meal.ingredients.every(
              (ing) => ing.name && ing.quantity && ing.unit
            )
          );
        };

        const validMeals = importedMeals.filter(isValidMeal);
        if (validMeals.length < importedMeals.length) {
          alert(
            `Warning: ${
              importedMeals.length - validMeals.length
            } invalid meals were skipped`
          );
        }

        let newMealsCount = 0;
        let duplicatesCount = 0;

        validMeals.forEach((importedMeal) => {
          const existingMeal = this.mealLibrary.find(
            (existing) =>
              existing.name.toLowerCase() === importedMeal.name.toLowerCase()
          );

          if (!existingMeal) {
            this.mealLibrary.push(importedMeal);
            newMealsCount++;
          } else {
            duplicatesCount++;
          }
        });

        this.saveMealLibrary();
        this.renderMealLibrary();
        this.updateMealOptions();
        alert(
          `${newMealsCount} new meals imported successfully! (${duplicatesCount} duplicates skipped)`
        );
      } catch (error) {
        alert(`Error importing meals: ${error.message}`);
      }
    };

    reader.onerror = () => {
      alert("Error reading file");
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  initializeSelects() {
    // Initialize day select
    const daySelect = document.getElementById("daySelect");
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Snacks",
    ];
    daySelect.innerHTML = days
      .map((day) => `<option value="${day}">${day}</option>`)
      .join("");

    // Initialize meal type select
    const mealTypeSelect = document.getElementById("mealTypeSelect");

    // Add event listener to day select to update meal types
    daySelect.addEventListener("change", () => {
      const selectedDay = daySelect.value;
      const mealTypes =
        selectedDay === "Snacks" ? ["snack"] : ["breakfast", "lunch", "dinner"];

      mealTypeSelect.innerHTML = mealTypes
        .map(
          (type) =>
            `<option value="${type}">${
              type.charAt(0).toUpperCase() + type.slice(1)
            }</option>`
        )
        .join("");

      // Update meal options based on new meal type
      this.updateMealOptions();
    });

    // Trigger initial meal type options
    daySelect.dispatchEvent(new Event("change"));
  }

  initializeTabs() {
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    // Set default active tab if none is active
    if (!document.querySelector(".tab.active")) {
      tabs[0]?.classList.add("active");
      const defaultContentId = tabs[0]?.getAttribute("data-tab");
      document.getElementById(defaultContentId)?.classList.add("active");
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        tab.classList.add("active");
        const contentId = tab.getAttribute("data-tab");
        const content = document.getElementById(contentId);
        if (content) {
          content.classList.add("active");
          if (contentId === "shoppingList") {
            this.updateShoppingList();
          }
        }
      });
    });
  }

  getRandomEmptyMessage() {
    const randomIndex = Math.floor(
      Math.random() * this.emptyListMessages.length
    );
    return this.emptyListMessages[randomIndex];
  }

  filterMealsByIngredient(ingredientName, mealsJSON) {
    try {
      const mealNames = JSON.parse(mealsJSON.replace(/&quot;/g, '"'));
      this.mealGridFilter = mealNames;

      // Switch to meal plan tab
      const mealPlanTab = document.querySelector('[data-tab="mealPlan"]');
      const mealPlanContent = document.getElementById("mealPlan");

      // Remove active class from all tabs and contents
      document
        .querySelectorAll(".tab")
        .forEach((tab) => tab.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));

      // Activate meal plan tab and content
      mealPlanTab.classList.add("active");
      mealPlanContent.classList.add("active");

      this.renderMealGrid();
    } catch (error) {
      console.error("Error parsing meals JSON:", error);
    }
  }

  clearMealFilter() {
    this.mealGridFilter = null;
    this.renderMealGrid();
  }
}

class StorageManager {
  constructor() {
    this.gistId = localStorage.getItem("gistId");
    this.githubToken = localStorage.getItem("githubToken");
    this.useGist = Boolean(this.gistId && this.githubToken);
    this.updateTimeout = null;
    this.progressInterval = null;
    this.DELAY = 5000; // 5 seconds
  }

  showProgress() {
    const progressElement = document.querySelector(".save-progress");
    const progressBar = progressElement.querySelector(".progress-bar");
    progressElement.style.display = "block";
    progressBar.style.width = "0%";

    let progress = 0;
    const updateInterval = 100; // Update every 100ms
    const incrementAmount = (updateInterval / this.DELAY) * 100;

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.progressInterval = setInterval(() => {
      progress += incrementAmount;
      if (progress >= 100) {
        clearInterval(this.progressInterval);
        setTimeout(() => {
          progressElement.style.display = "none";
        }, 500);
      } else {
        progressBar.style.width = `${progress}%`;
      }
    }, updateInterval);
  }

  hideProgress() {
    const progressElement = document.querySelector(".save-progress");
    const progressBar = progressElement.querySelector(".progress-bar");
    progressBar.style.width = "100%";

    setTimeout(() => {
      progressElement.style.display = "none";
      progressBar.style.width = "0%";
    }, 500);

    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  async initialize() {
    if (this.useGist) {
      try {
        await this.testGistConnection();
      } catch (error) {
        console.error("Failed to connect to GitHub Gist:", error);
        this.useGist = false;
      }
    }
  }

  async updateSettings() {
    const settingsDialog = document.createElement("dialog");
    settingsDialog.className = "settings-dialog";

    // Function to mask the Gist ID
    const maskGistId = (gistId) => {
      if (!gistId) return "";
      return `${gistId.slice(0, 4)}${"*".repeat(
        gistId.length - 8
      )}${gistId.slice(-4)}`;
    };

    settingsDialog.innerHTML = `
      <form method="dialog" class="settings-form">
        <h2>GitHub Gist Settings</h2>
        <p class="settings-description">Configure GitHub Gist to sync your meal plans across devices</p>
        
        <div class="form-group">
          <label for="githubToken">GitHub Token:</label>
          <input 
            type="password" 
            id="githubToken" 
            placeholder="Enter GitHub token"
            value="${
              this.useGist ? "****************************************" : ""
            }"
            ${this.useGist ? "disabled" : ""}
          />
        </div>
        
        <div class="form-group">
          <label for="gistId">Gist ID:</label>
          <input 
            type="text" 
            id="gistId" 
            placeholder="Enter Gist ID"
            value="${this.useGist ? maskGistId(this.gistId) : ""}"
            ${this.useGist ? "disabled" : ""}
          />
        </div>
        
        ${
          this.useGist
            ? `
          <div class="connection-status">
            <span class="status-icon">✓</span>
            Connected to GitHub Gist
          </div>
        `
            : ""
        }
        
        <div class="settings-actions">
          <div class="dialog-buttons">
            <button type="button" class="btn btn-danger" id="resetApp">Reset App</button>
            <button type="button" class="btn btn-secondary" id="cancelSettings">Cancel</button>
            ${
              !this.useGist
                ? `
              <button type="submit" class="btn btn-primary" id="saveSettings">Save</button>
            `
                : ""
            }
          </div>
        </div>
      </form>
    `;

    document.body.appendChild(settingsDialog);

    const closeDialog = () => {
      settingsDialog.close();
      settingsDialog.remove();
    };

    settingsDialog.querySelector("#cancelSettings").onclick = closeDialog;

    // Add reset handler
    settingsDialog.querySelector("#resetApp").onclick = () => {
      if (
        confirm(
          "Are you sure you want to reset the app? This will clear all data and settings."
        )
      ) {
        // Clear localStorage
        localStorage.clear();

        // Clear credentials
        this.githubToken = null;
        this.gistId = null;
        this.useGist = false;

        alert("App has been reset. The page will now reload.");
        window.location.reload();
      }
    };

    const form = settingsDialog.querySelector("form");
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const newToken = settingsDialog
          .querySelector("#githubToken")
          .value.trim();
        const newGistId = settingsDialog.querySelector("#gistId").value.trim();

        if (newToken && newGistId) {
          this.githubToken = newToken;
          this.gistId = newGistId;

          try {
            await this.testGistConnection();
            this.useGist = true;
            localStorage.setItem("githubToken", newToken);
            localStorage.setItem("gistId", newGistId);
            alert("Settings saved successfully!");
            closeDialog();
            // Reopen the dialog to show the disabled state
            this.updateSettings();
          } catch (error) {
            alert(
              "Failed to connect to GitHub Gist. Please check your credentials."
            );
            this.useGist = false;
          }
        } else {
          this.useGist = false;
          localStorage.removeItem("githubToken");
          localStorage.removeItem("gistId");
          alert("Gist sync disabled. Using local storage only.");
          closeDialog();
        }
      };
    }

    settingsDialog.showModal();
  }

  async testGistConnection() {
    const response = await fetch(
      `https://api.github.com/gists/${this.gistId}`,
      {
        headers: {
          Authorization: `token ${this.githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to connect to GitHub Gist");
    }
  }

  async saveToGist(mealPlan, mealLibrary) {
    if (!this.useGist) return;

    // Clear any existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Show the progress bar
    this.showProgress();

    // Set new timeout
    this.updateTimeout = setTimeout(async () => {
      try {
        const content = {
          mealPlan,
          mealLibrary,
        };

        const response = await fetch(
          `https://api.github.com/gists/${this.gistId}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `token ${this.githubToken}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              files: {
                "meal-planner-data.json": {
                  content: JSON.stringify(content, null, 2),
                },
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to save to Gist");
        }
      } catch (error) {
        console.error("Error saving to Gist:", error);
        alert("Failed to save to Gist. Changes saved locally only.");
      } finally {
        this.hideProgress();
      }
    }, this.DELAY);
  }

  async loadFromGist() {
    if (!this.useGist) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.github.com/gists/${this.gistId}`,
        {
          headers: {
            Authorization: `token ${this.githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load from Gist");
      }

      const data = await response.json();
      const content = data.files["meal-planner-data.json"]?.content;

      return content ? JSON.parse(content) : null;
    } catch (error) {
      console.error("Error loading from Gist:", error);
      alert("Failed to load from Gist. Using local storage.");
      return null;
    }
  }
}

// Initialize the meal planner
document.addEventListener("DOMContentLoaded", async () => {
  const mealPlanner = new MealPlanner();
  window.mealPlanner = mealPlanner;
});
