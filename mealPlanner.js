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

    this.meals = this.loadMeals();
    this.mealLibrary = this.loadMealLibrary();
    this.showCreatedMeals = false;
    this.initializeEventListeners();
    this.renderMealGrid();
    this.renderMealLibrary();
    this.attachIngredientEventListeners();
    this.currentEditIndex = null;
    this.initializeImportExport();
    this.initializeSelects();
    this.initializeTabs();
    // Initial shopping list update
    this.updateShoppingList();
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
        };
    return meals;
  }

  loadMealLibrary() {
    const savedMeals = localStorage.getItem("mealLibrary");
    return savedMeals ? JSON.parse(savedMeals) : [];
  }

  saveMeals() {
    localStorage.setItem("mealPlan", JSON.stringify(this.meals));
  }

  saveMealLibrary() {
    localStorage.setItem("mealLibrary", JSON.stringify(this.mealLibrary));
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
  }

  attachIngredientEventListeners() {
    const addIngredientButton = document.getElementById("addIngredient");
    addIngredientButton.addEventListener("click", () =>
      this.addIngredientRow()
    );

    document
      .getElementById("ingredientsList")
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-ingredient")) {
          e.target.parentElement.remove();
        }
      });
  }

  addIngredientRow(ingredient = {}) {
    const ingredientsList = document.getElementById("ingredientsList");
    const ingredientItem = document.createElement("div");
    ingredientItem.className = "ingredient-item";

    ingredientItem.innerHTML = `
      <input type="text" class="ingredient-name" placeholder="Ingredient Name" required />
      <input type="number" class="ingredient-quantity" placeholder="Quantity" min="0" step="any" required />
      <select class="ingredient-unit" required>
        <option value="" disabled selected>Unit</option>
        <option value="tsp">teaspoon (tsp)</option>
        <option value="tbsp">tablespoon (tbsp)</option>
        <option value="cup">cup</option>
        <option value="oz">ounces (oz)</option>
        <option value="lb">pounds (lb)</option>
        <option value="pkg">packages (pkg)</option>
        <option value="unit">units</option>
      </select>
      <button type="button" class="btn btn-danger remove-ingredient">Remove</button>
    `;

    // Set input values if editing
    if (ingredient.name) {
      ingredientItem.querySelector(".ingredient-name").value = ingredient.name;
      ingredientItem.querySelector(".ingredient-quantity").value =
        ingredient.quantity;
      ingredientItem.querySelector(".ingredient-unit").value = ingredient.unit;
    }

    ingredientsList.appendChild(ingredientItem);
  }

  addToPlan() {
    const day = document.getElementById("daySelect").value;
    const mealType = document.getElementById("mealTypeSelect").value;
    const selectedMealName = document.getElementById("mealSelect").value;

    if (selectedMealName) {
      const selectedMeal = this.mealLibrary.find(
        (meal) => meal.name === selectedMealName
      );
      if (selectedMeal) {
        if (!this.meals[day][mealType].includes(selectedMealName)) {
          this.meals[day][mealType].push(selectedMealName);
          this.saveMeals();
          this.renderMealGrid();
        }
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

    const categories = Array.from(mealTypeCheckboxes).map((cb) => cb.value);

    const ingredients = Array.from(ingredientItems).map((item) => {
      const name = item.querySelector(".ingredient-name").value.trim();
      const quantity = parseFloat(
        item.querySelector(".ingredient-quantity").value
      );
      const unit = item.querySelector(".ingredient-unit").value;

      return { name, quantity, unit };
    });

    if (mealName && ingredients.length > 0 && categories.length > 0) {
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
        // Add new meal
        this.mealLibrary.push(meal);
      }

      this.saveMealLibrary();
      this.renderMealLibrary();
      this.updateMealOptions(); // Update meal options after adding or editing a meal

      // Reset the form
      document.getElementById("mealLibraryForm").reset();
      document.getElementById("ingredientsList").innerHTML = "";
      this.addIngredientRow(); // Reset ingredients list
      document.getElementById("saveMealButton").textContent = "Save Meal";
    }
  }

  removeFromLibrary(index) {
    // Get the meal name before removing it
    const mealToRemove = this.mealLibrary[index].name;

    // Remove from library
    this.mealLibrary.splice(index, 1);

    // Remove from planned meals
    Object.keys(this.meals).forEach((day) => {
      Object.keys(this.meals[day]).forEach((mealType) => {
        this.meals[day][mealType] = this.meals[day][mealType].filter(
          (meal) => meal !== mealToRemove
        );
      });
    });

    // Need to update the shopping list here
    this.updateShoppingList();

    // Save both meal library and planned meals
    this.saveMealLibrary();
    this.saveMeals();

    // Update both displays
    this.renderMealLibrary();
    this.renderMealGrid();
  }

  renderMealGrid() {
    const grid = document.getElementById("mealGrid");
    grid.innerHTML = "";

    const daysOrder = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    daysOrder.forEach((day) => {
      const dayMeals = this.meals[day];
      const dayCard = document.createElement("div");
      dayCard.className = "day-card";

      dayCard.innerHTML = `
              <h2>${day}</h2>
              <div class="meal-list">
                  ${Object.entries(dayMeals)
                    .map(
                      ([mealType, meals]) => `
                      <div class="meal-item">
                          <div class="meal-details">
                              <strong>${
                                mealType.charAt(0).toUpperCase() +
                                mealType.slice(1)
                              }:</strong>
                              ${
                                meals.length > 0
                                  ? meals
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
                                          mealData.instructions
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
                         Clear Day
                       </button>
                     </div>`
                  : ""
              }
          `;

      grid.appendChild(dayCard);
    });

    this.updateShoppingList();
  }

  toggleRecipe(element) {
    // Find recipe details within the parent planned-meal div
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

    container.innerHTML = "";

    const mealsWithIndices = this.mealLibrary.map((meal, index) => ({
      meal,
      originalIndex: index,
    }));

    const sortedMeals = mealsWithIndices.sort((a, b) =>
      a.meal.name.toLowerCase().localeCompare(b.meal.name.toLowerCase())
    );

    if (!this.showCreatedMeals) {
      container.style.display = "none";
      return;
    }

    container.style.display = "grid";

    sortedMeals.forEach(({ meal, originalIndex }) => {
      const mealElement = document.createElement("div");
      mealElement.className = "meal-item-card";
      mealElement.innerHTML = `
        <div class="meal-content">
          <div>${meal.name}<span>(${meal.categories.join(", ")})</span></div>
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
          <button class="btn btn-primary edit-meal" data-index="${originalIndex}">Edit</button>
          <button class="btn btn-danger remove-meal" data-index="${originalIndex}">Remove</button>
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

      // Add event listener to the edit button
      const editButton = mealElement.querySelector(".edit-meal");
      editButton.addEventListener("click", () => this.editMeal(originalIndex));

      // Update remove button selector
      const removeButton = mealElement.querySelector(".remove-meal");
      removeButton.addEventListener("click", () =>
        this.removeFromLibrary(originalIndex)
      );

      container.appendChild(mealElement);
    });
  }

  editMeal(index) {
    const meal = this.mealLibrary[index];
    this.currentEditIndex = index;

    // Populate the form with existing meal data
    document.getElementById("mealNameInput").value = meal.name;
    document.getElementById("recipeInstructions").value =
      meal.instructions || "";

    // Clear existing ingredient rows
    document.getElementById("ingredientsList").innerHTML = "";

    // Populate ingredients
    meal.ingredients.forEach((ingredient) => {
      this.addIngredientRow(ingredient);
    });

    // Set checked checkboxes for meal types
    const mealTypeCheckboxes = document.querySelectorAll(
      'input[name="mealType"]'
    );
    mealTypeCheckboxes.forEach((checkbox) => {
      checkbox.checked = meal.categories.includes(checkbox.value);
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
        .map(
          (item) => `
          <li>
            <div class="shopping-item">
              <span class="ingredient-detail">${item.quantity} ${item.unit} ${
            item.name
          }</span>
              <span class="meal-sources">Used in: ${Array.from(item.meals).join(
                " | "
              )}</span>
            </div>
          </li>
        `
        )
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
    ];
    daySelect.innerHTML = days
      .map((day) => `<option value="${day}">${day}</option>`)
      .join("");

    // Initialize meal type select
    const mealTypeSelect = document.getElementById("mealTypeSelect");
    const mealTypes = ["breakfast", "lunch", "dinner"];
    mealTypeSelect.innerHTML = mealTypes
      .map(
        (type) =>
          `<option value="${type}">${
            type.charAt(0).toUpperCase() + type.slice(1)
          }</option>`
      )
      .join("");

    // Trigger meal options update
    this.updateMealOptions();
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
}

// Initialize the meal planner
document.addEventListener("DOMContentLoaded", () => {
  const mealPlanner = new MealPlanner();
  window.mealPlanner = mealPlanner; // Make it available globally if needed
});
