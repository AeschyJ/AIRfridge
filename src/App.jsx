import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom'; 
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp, Timestamp, setDoc, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { Edit3, Trash2, Brain, Utensils, PlusCircle, Save, XCircle, ChevronsUpDown, CalendarDays, Package, Thermometer, Clock, Info, ExternalLink, Sparkles, ShoppingCart, CookingPot, Settings, Palette, Languages, Moon, Sun, ListPlus, CheckSquare, AlertTriangle, Bell, SortAsc, SortDesc, ArrowDownUp, PlusSquare, ChevronDown, ChevronUp, History, CheckCircle2, Bookmark, Eye, X, Plus, Check, AlertCircle, SlidersHorizontal, RefreshCw } from 'lucide-react'; 

// Firebase 配置 (從環境變數獲取)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const ai = getAI(app, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { model: "gemini-2.5-flash-preview-05-20" });

// 獲取 App ID
const appId = import.meta.env.VITE_APP_ID; // 從環境變數獲取

// 翻譯文本
const translations = {
  'zh-TW': {
    appName: '我的智慧冰箱',
    loadingFridge: '正在準備您的智慧冰箱...',
    userIdLabel: '使用者ID',
    addFoodTitle: '新增食物到冰箱',
    editFoodTitle: '編輯食物資訊',
    foodNameLabel: '食物名稱',
    foodNamePlaceholder: '例如：牛奶、雞蛋、蘋果',
    quantityLabel: '數量/單位',
    quantityPlaceholder: '例如：1公升、12顆、3個',
    purchaseDateLabel: '購買日期',
    manualExpiryDateLabel: '自訂過期日 (選填)',
    manualExpiryDatePlaceholder: 'YYYY-MM-DD',
    addButton: '新增',
    fridgeContentsTitle: '冰箱內容物',
    emptyFridge: '您的冰箱目前是空的，快去新增一些美味食材吧！',
    aiRecipeButton: 'AI 食譜建議',
    customRecipeSettingsButtonTitle: '自訂食譜條件',
    purchaseDateDisplay: '購買日期',
    quantityDisplay: '数量',
    storageLocationDisplay: '建議位置',
    shelfLifeDaysDisplay: '預計可保存',
    actualExpiryDateDisplay: '預計過期日',
    manualExpiryDateInfo: '使用自訂過期日',
    daysUnit: '天',
    expiresIn: '將於',
    daysExpireUnit: '天後過期',
    expiredToday: '今天過期',
    expired: '已過期',
    aiStorageButton: 'AI 儲存建議',
    editButton: '編輯',
    deleteButton: '刪除',
    confirmDeleteButton: '確認刪除',
    saveButton: '儲存',
    cancelButton: '取消',
    settingsTitle: '設定',
    themeLabel: '佈景主題',
    languageLabel: '語言',
    lightTheme: '淺色模式',
    darkTheme: '深色模式',
    oceanTheme: '海洋藍',
    forestTheme: '森林綠',
    shoppingListTitle: '購物清單',
    shoppingItemNameLabel: '品名',
    shoppingItemUnitLabel: '單位 (選填)',
    shoppingItemUnitPlaceholder: '例如：瓶、袋',
    addShoppingItemPlaceholder: '例如：番茄、洋蔥', 
    addShoppingItemButton: '加入清單',
    emptyShoppingList: '購物清單是空的。',
    recipeModalTitle: 'AI 食譜提案',
    recipeIngredientsLabel: '所需食材',
    recipeStepsLabel: '烹飪步驟',
    closeRecipeButton: '關閉食譜',
    errorAuth: '身份驗證失敗，請重試。',
    errorAddItem: '新增食物失敗，請稍後再試。',
    errorDeleteItem: '刪除食物失敗，請稍後再試。',
    errorUpdateItem: '更新食物失敗，請稍後再試。',
    errorGetAIAdvice: '獲取 AI 建議失敗',
    errorGetAIRecipes: '獲取食譜建議失敗',
    errorLoadData: '讀取資料失敗。',
    errorFormValidation: '請填寫必填欄位 (食物名稱和數量)。',
    successAddItem: '已成功新增！',
    successDeleteItem: '食物已成功刪除！',
    successUpdateItem: '食物資訊已更新！',
    successUpdateAIAdvice: '已更新 AI建議！',
    successSaveCustomPrefs: '自訂食譜偏好已儲存！',
    errorSaveCustomPrefs: '儲存自訂食譜偏好失敗。',
    successSettingsSaved: '設定已儲存！',
    infoNoIngredientsForRecipe: '冰箱裡沒有未過期食材，快去新增一些吧！',
    infoAINoRecipes: 'AI沒有找到合適的食譜，試試看調整食材或自訂條件？',
    infoNoSettingsChanged: '設定未變更。',
    promptStorageLocation: '冰箱儲存位置',
    promptShelfLifeDays: '從購買日起可保存的天數',
    promptRecipeName: '食譜名稱',
    promptIngredients: '所需食材',
    promptSteps: '烹飪步驟',
    promptProvideInLanguage: '請用{language}回覆。',
    footerText: '由 AI 驅動的美味生活.',
    geminiApiLinkText: '使用 Gemini API',
    expiringSoon: '即將過期',
    purchased: '已購買',
    markAsPurchased: '標記為已買',
    markAsNotPurchased: '標記為未買',
    removeFromList: '從清單移除',
    errorAddShoppingItem: '新增購物項目失敗。',
    errorUpdateShoppingItem: '更新購物項目失敗。',
    errorDeleteShoppingItem: '刪除購物項目失敗。',
    errorLoadShoppingList: '讀取購物清單失敗。',
    sortLabel: '排序方式',
    sortByExpiryDate: '依到期日',
    sortByPurchaseDate: '依購買日期',
    sortByName: '依品名',
    sortByAddedDate: '依加入順序',
    sortDirectionAsc: '正序',
    sortDirectionDesc: '倒序',
    confirmClearAIAdvice: '修改食物名稱或購買日期將會清除AI建議（不影響自訂過期日），確定嗎？',
    addShoppingItemToFridge: '加入冰箱',
    shoppingItemAddedToFridgeForm: '{name} 已填入新增表單，請確認購買日期後新增。',
    recipeIngredientsMissingInfo: '以下是食譜「{recipeName}」中，您可能缺少或已過期的食材。請勾選要加入購物清單的項目：',
    addMissingToShoppingListButton: '將選取食材加入購物清單',
    ingredientsAddedToShoppingList: '選取食材已加入購物清單！',
    noMissingIngredients: '太棒了！這道食譜的食材您都有！',
    selectIngredientsModalTitle: '選擇要加入購物清單的食材',
    confirmAddSelectedButton: '加入已選項目',
    noItemsSelected: '請先勾選要加入的食材。',
    unknownError: '未知錯誤',
    saveRecipeButton: '儲存食譜',
    recipeSavedSuccess: '食譜「{recipeName}」已儲存！',
    recipeAlreadySaved: '食譜「{recipeName}」已經儲存過了。',
    errorSavingRecipe: '儲存食譜「{recipeName}」失敗。',
    savedRecipesTitle: '已存食譜',
    emptySavedRecipes: '您還沒有儲存任何食譜。',
    viewRecipeButton: '檢視食譜',
    deleteSavedRecipeButton: '刪除此食譜',
    confirmDeleteSavedRecipePrompt: '確定要刪除食譜「{recipeName}」嗎？此動作無法復原。',
    savedRecipeDeletedSuccess: '食譜「{recipeName}」已刪除。',
    errorDeletingSavedRecipe: '刪除食譜「{recipeName}」失敗。',
    shoppingListSortByName: '依品名',
    shoppingListSortByAdded: '依加入順序',
    savedRecipesButtonTitle: '已存食譜',
    openAddFoodModalButton: '新增食物',
    openShoppingListModalButton: '購物清單',
    confirmIconTitle: '確認刪除',
    cancelIconTitle: '取消刪除',
    customRecipeSettingsTitle: "自訂食譜條件",
    cuisineLabel: "菜系",
    cuisineNone: "無指定",
    cuisineEuropean: "歐式",
    cuisineJapanese: "日式",
    cuisineSichuan: "川菜",
    cuisineCantonese: "粵菜",
    cuisineTaiwanese: "台菜",
    cuisineOther: "其他",
    customCuisinePlaceholder: "請輸入菜系名稱",
    avoidIngredientsLabel: "不想吃的食材 (以逗號分隔)",
    avoidIngredientsPlaceholder: "例如：香菜、洋蔥",
    generateCustomRecipesButton: "產生客製化食譜",
    saveAndGenerateButton: "儲存並以此設定產生食譜",
    saveSettingsButton: "儲存設定",
    generateWithoutSavingButton: "以此設定產生 (不儲存)",
    generateMoreRecipesButton: "獲取更多食譜建議",
    recipesWithThisItemButton: "以此食材產生食譜",
    promptAvoidRecipes: '請避免重複以下食譜：{recipeNames}。',
    promptTargetItemRecipe: '我的冰箱裡有「{targetItemName}」。請優先使用此食材設計 2 道食譜。可搭配使用冰箱中其他未過期食材：{otherIngredients}。',
    themeDropdownTitle: '選擇佈景主題',
  },
  'en-US': {
    appName: 'My Smart Fridge',
    loadingFridge: 'Preparing your smart fridge...',
    userIdLabel: 'User ID',
    addFoodTitle: 'Add Food to Fridge',
    editFoodTitle: 'Edit Food Item',
    foodNameLabel: 'Food Name',
    foodNamePlaceholder: 'e.g., Milk, Eggs, Apple',
    quantityLabel: 'Quantity/Unit',
    quantityPlaceholder: 'e.g., 1 liter, 12 pcs, 3 units',
    purchaseDateLabel: 'Purchase Date',
    manualExpiryDateLabel: 'Manual Expiry Date (Optional)',
    manualExpiryDatePlaceholder: 'YYYY-MM-DD',
    addButton: 'Add',
    fridgeContentsTitle: 'Fridge Contents',
    emptyFridge: 'Your fridge is currently empty. Add some delicious ingredients!',
    aiRecipeButton: 'AI Recipe Suggestions',
    customRecipeSettingsButtonTitle: 'Custom Recipe Settings',
    purchaseDateDisplay: 'Purchase Date',
    quantityDisplay: 'Quantity',
    storageLocationDisplay: 'Suggested Location',
    shelfLifeDaysDisplay: 'Est. Shelf Life',
    actualExpiryDateDisplay: 'Est. Expiry Date',
    manualExpiryDateInfo: 'Using manual expiry date',
    daysUnit: 'days',
    expiresIn: 'Expires in',
    daysExpireUnit: 'days',
    expiredToday: 'Expires today',
    expired: 'Expired',
    aiStorageButton: 'AI Storage Advice',
    editButton: 'Edit',
    deleteButton: 'Delete',
    confirmDeleteButton: 'Confirm Delete',
    saveButton: 'Save',
    cancelButton: 'Cancel',
    settingsTitle: 'Settings',
    themeLabel: 'Theme',
    languageLabel: 'Language',
    lightTheme: 'Light Mode',
    darkTheme: 'Dark Mode',
    oceanTheme: 'Ocean Blue',
    forestTheme: 'Forest Green',
    shoppingListTitle: 'Shopping List',
    shoppingItemNameLabel: 'Item Name',
    shoppingItemUnitLabel: 'Unit (Optional)',
    shoppingItemUnitPlaceholder: 'e.g., bottle, bag',
    addShoppingItemPlaceholder: 'e.g., Tomatoes, Onions',
    addShoppingItemButton: 'Add to List',
    emptyShoppingList: 'Shopping list is empty.',
    recipeModalTitle: 'AI Recipe Ideas',
    recipeIngredientsLabel: 'Ingredients',
    recipeStepsLabel: 'Steps',
    closeRecipeButton: 'Close Recipes',
    errorAuth: 'Authentication failed. Please try again.',
    errorAddItem: 'Failed to add food item. Please try again later.',
    errorDeleteItem: 'Failed to delete food item. Please try again later.',
    errorUpdateItem: 'Failed to update food item. Please try again later.',
    errorGetAIAdvice: 'Failed to get AI advice',
    errorGetAIRecipes: 'Failed to get recipe suggestions',
    errorLoadData: 'Failed to load data.',
    errorFormValidation: 'Please fill in required fields (Food Name and Quantity).',
    successAddItem: 'successfully added!',
    successDeleteItem: 'Food item successfully deleted!',
    successUpdateItem: 'Food information updated!',
    successUpdateAIAdvice: 'AI advice updated for',
    successSaveCustomPrefs: 'Custom recipe preferences saved!',
    errorSaveCustomPrefs: 'Failed to save custom recipe preferences.',
    successSettingsSaved: 'Settings saved!',
    infoNoSettingsChanged: 'Settings not changed.',
    infoNoIngredientsForRecipe: 'No non-expired ingredients in the fridge. Go add some!',
    infoAINoRecipes: "AI couldn't find suitable recipes. Try adjusting ingredients or custom settings?",
    promptStorageLocation: 'refrigerator storage location',
    promptShelfLifeDays: 'estimated shelf life in days from purchase',
    promptRecipeName: 'Recipe Name',
    promptIngredients: 'Ingredients',
    promptSteps: 'Cooking Steps',
    promptProvideInLanguage: 'Please reply in {language}.',
    footerText: 'Delicious living powered by AI.',
    geminiApiLinkText: 'Uses Gemini API',
    expiringSoon: 'Expiring Soon',
    purchased: 'Purchased',
    markAsPurchased: 'Mark as Purchased',
    markAsNotPurchased: 'Mark as Not Purchased',
    removeFromList: 'Remove from List',
    errorAddShoppingItem: 'Failed to add shopping item.',
    errorUpdateShoppingItem: 'Failed to update shopping item.',
    errorDeleteShoppingItem: 'Failed to delete shopping item.',
    errorLoadShoppingList: 'Failed to load shopping list.',
    sortLabel: 'Sort by',
    sortByExpiryDate: 'Expiry Date',
    sortByPurchaseDate: 'Purchase Date',
    sortByName: 'Name',
    sortByAddedDate: 'Date Added',
    sortDirectionAsc: 'Ascending',
    sortDirectionDesc: 'Descending',
    confirmClearAIAdvice: 'Modifying food name or purchase date will clear AI advice (manual expiry date unaffected). Are you sure?',
    addShoppingItemToFridge: 'Add to Fridge',
    shoppingItemAddedToFridgeForm: '{name} has been pre-filled in the add form. Confirm purchase date and add.',
    recipeIngredientsMissingInfo: 'The following ingredients for "{recipeName}" might be missing or expired. Check the items you want to add to your shopping list:',
    addMissingToShoppingListButton: 'Add Selected to Shopping List',
    ingredientsAddedToShoppingList: 'Selected ingredients added to shopping list!',
    noMissingIngredients: 'Great! You have all ingredients for this recipe!',
    selectIngredientsModalTitle: 'Select Ingredients to Add to Shopping List',
    confirmAddSelectedButton: 'Add Selected Items',
    noItemsSelected: 'Please select items to add.',
    unknownError: 'Unknown error',
    saveRecipeButton: 'Save Recipe',
    recipeSavedSuccess: 'Recipe "{recipeName}" saved!',
    recipeAlreadySaved: 'Recipe "{recipeName}" is already saved.',
    errorSavingRecipe: 'Failed to save recipe "{recipeName}".',
    savedRecipesTitle: 'Saved Recipes',
    emptySavedRecipes: 'You haven\'t saved any recipes yet.',
    viewRecipeButton: 'View Recipe',
    deleteSavedRecipeButton: 'Delete this recipe',
    confirmDeleteSavedRecipePrompt: 'Are you sure you want to delete recipe "{recipeName}"? This action cannot be undone.',
    savedRecipeDeletedSuccess: 'Recipe "{recipeName}" deleted.',
    errorDeletingSavedRecipe: 'Failed to delete recipe "{recipeName}".',
    shoppingListSortByName: 'Name',
    shoppingListSortByAdded: 'Date Added',
    savedRecipesButtonTitle: 'Saved Recipes',
    openAddFoodModalButton: 'Add Food',
    openShoppingListModalButton: 'Shopping List',
    confirmIconTitle: 'Confirm Delete',
    cancelIconTitle: 'Cancel Delete',
    customRecipeSettingsTitle: "Custom Recipe Settings",
    cuisineLabel: "Cuisine",
    cuisineNone: "Any",
    cuisineEuropean: "European",
    cuisineJapanese: "Japanese",
    cuisineSichuan: "Sichuan",
    cuisineCantonese: "Cantonese",
    cuisineTaiwanese: "Taiwanese",
    cuisineOther: "Other",
    customCuisinePlaceholder: "Enter cuisine name",
    avoidIngredientsLabel: "Ingredients to Avoid (comma-separated)",
    avoidIngredientsPlaceholder: "e.g., Coriander, Onion",
    generateCustomRecipesButton: "Generate Custom Recipes",
    saveAndGenerateButton: "Save & Generate with these Settings",
    saveSettingsButton: "Save Settings",
    generateWithoutSavingButton: "Generate with these Settings (Don't Save)",
    generateMoreRecipesButton: "Get More Recipe Suggestions",
    recipesWithThisItemButton: "Generate Recipes with this Item",
    promptAvoidRecipes: 'Please avoid recommending the following recipes again: {recipeNames}.',
    promptTargetItemRecipe: 'My fridge contains "{targetItemName}". Please design 2 recipes primarily using this ingredient. You can also use other non-expired ingredients from my fridge: {otherIngredients}.',
    themeDropdownTitle: 'Select Theme',
  },
  'ja-JP': {
    appName: '私のスマート冷蔵庫',
    loadingFridge: 'スマート冷蔵庫を準備しています...',
    userIdLabel: 'ユーザーID',
    addFoodTitle: '冷蔵庫に食品を追加',
    editFoodTitle: '食品情報を編集',
    foodNameLabel: '食品名',
    foodNamePlaceholder: '例：牛乳、卵、リンゴ',
    quantityLabel: '数量/単位',
    quantityPlaceholder: '例：1リットル、12個、3個',
    purchaseDateLabel: '購入日',
    manualExpiryDateLabel: '手動賞味期限（任意）',
    manualExpiryDatePlaceholder: 'YYYY-MM-DD',
    addButton: '追加',
    fridgeContentsTitle: '冷蔵庫の中身',
    emptyFridge: '冷蔵庫は現在空です。美味しい食材を追加しましょう！',
    aiRecipeButton: 'AIレシピ提案',
    customRecipeSettingsButtonTitle: 'カスタムレシピ条件',
    purchaseDateDisplay: '購入日',
    quantityDisplay: '数量',
    storageLocationDisplay: '推奨場所',
    shelfLifeDaysDisplay: '推定保存日数',
    actualExpiryDateDisplay: '推定賞味期限',
    manualExpiryDateInfo: '手動賞味期限を使用中',
    daysUnit: '日間',
    expiresIn: '期限まであと',
    daysExpireUnit: '日',
    expiredToday: '今日が期限です',
    expired: '期限切れ',
    aiStorageButton: 'AI保存アドバイス',
    editButton: '編集',
    deleteButton: '削除',
    confirmDeleteButton: '削除を確認',
    saveButton: '保存',
    cancelButton: 'キャンセル',
    settingsTitle: '設定',
    themeLabel: 'テーマ',
    languageLabel: '言語',
    lightTheme: 'ライトモード',
    darkTheme: 'ダークモード',
    oceanTheme: 'オーシャンブルー',
    forestTheme: 'フォレストグリーン',
    shoppingListTitle: '買い物リスト',
    shoppingItemNameLabel: '品名',
    shoppingItemUnitLabel: '単位（任意）',
    shoppingItemUnitPlaceholder: '例：本、袋',
    addShoppingItemPlaceholder: '例：トマト、玉ねぎ',
    addShoppingItemButton: 'リストに追加',
    emptyShoppingList: '買い物リストは空です。',
    recipeModalTitle: 'AIレシピのアイデア',
    recipeIngredientsLabel: '材料',
    recipeStepsLabel: '手順',
    closeRecipeButton: 'レシピを閉じる',
    errorAuth: '認証に失敗しました。もう一度お試しください。',
    errorAddItem: '食品の追加に失敗しました。後でもう一度お試しください。',
    errorDeleteItem: '食品の削除に失敗しました。後でもう一度お試しください。',
    errorUpdateItem: '食品情報の更新に失敗しました。後でもう一度お試しください。',
    errorGetAIAdvice: 'AIアドバイスの取得に失敗しました',
    errorGetAIRecipes: 'レシピ提案の取得に失敗しました',
    errorLoadData: 'データの読み込みに失敗しました。',
    errorFormValidation: '必須項目（食品名と数量）を記入してください。',
    successAddItem: '正常に追加されました！',
    successDeleteItem: '食品が正常に削除されました！',
    successUpdateItem: '食品情報が更新されました！',
    successUpdateAIAdvice: 'AIアドバイスが更新されました：',
    successSaveCustomPrefs: 'カスタムレシピの設定が保存されました！',
    errorSaveCustomPrefs: 'カスタムレシピ設定の保存に失敗しました。',
    successSettingsSaved: '設定が保存されました！',
    infoNoSettingsChanged: '設定は変更されていません。',
    infoNoIngredientsForRecipe: '冷蔵庫に期限切れでない材料がありません。追加してください！',
    infoAINoRecipes: 'AIは適切なレシピを見つけられませんでした。材料やカスタム条件を調整してみてください。',
    promptStorageLocation: '冷蔵庫の保管場所',
    promptShelfLifeDays: '購入日からの推定保存日数',
    promptRecipeName: 'レシピ名',
    promptIngredients: '材料',
    promptSteps: '調理手順',
    promptProvideInLanguage: '{language}で返信してください。',
    footerText: 'AIによる美味しい生活。',
    geminiApiLinkText: 'Gemini APIを使用',
    expiringSoon: 'まもなく期限切れ',
    purchased: '購入済み',
    markAsPurchased: '購入済みにする',
    markAsNotPurchased: '未購入にする',
    removeFromList: 'リストから削除',
    errorAddShoppingItem: '買い物項目の追加に失敗しました。',
    errorUpdateShoppingItem: '買い物項目の更新に失敗しました。',
    errorDeleteShoppingItem: '買い物項目の削除に失敗しました。',
    errorLoadShoppingList: '買い物リストの読み込みに失敗しました。',
    sortLabel: '並び替え',
    sortByExpiryDate: '賞味期限順',
    sortByPurchaseDate: '購入日順',
    sortByName: '名前順',
    sortByAddedDate: '追加日順',
    sortDirectionAsc: '昇順',
    sortDirectionDesc: '降順',
    confirmClearAIAdvice: '食品名または購入日を変更すると、AIアドバイスがクリアされます（手動賞味期限は影響を受けません）。よろしいですか？',
    addShoppingItemToFridge: '冷蔵庫に追加',
    shoppingItemAddedToFridgeForm: '{name} を追加フォームに事前入力しました。購入日を確認して追加してください。',
    recipeIngredientsMissingInfo: '「{recipeName}」の材料のうち、不足しているか期限切れの可能性があるものがあります。買い物リストに追加する項目にチェックを入れてください：',
    addMissingToShoppingListButton: '選択した材料を買い物リストに追加',
    ingredientsAddedToShoppingList: '選択した材料を買い物リストに追加しました！',
    noMissingIngredients: '素晴らしい！このレシピの材料は全て揃っています！',
    selectIngredientsModalTitle: '買い物リストに追加する材料を選択',
    confirmAddSelectedButton: '選択項目を追加',
    noItemsSelected: '追加する材料を選択してください。',
    unknownError: '不明なエラー',
    saveRecipeButton: 'レシピを保存',
    recipeSavedSuccess: 'レシピ「{recipeName}」を保存しました！',
    recipeAlreadySaved: 'レシピ「{recipeName}」は既に保存されています。',
    errorSavingRecipe: 'レシピ「{recipeName}」の保存に失敗しました。',
    savedRecipesTitle: '保存済みレシピ',
    emptySavedRecipes: 'まだ保存されたレシピはありません。',
    viewRecipeButton: 'レシピを見る',
    deleteSavedRecipeButton: 'このレシピを削除',
    confirmDeleteSavedRecipePrompt: 'レシピ「{recipeName}」を削除してもよろしいですか？この操作は元に戻せません。',
    savedRecipeDeletedSuccess: 'レシピ「{recipeName}」を削除しました。',
    errorDeletingSavedRecipe: 'レシピ「{recipeName}」の削除に失敗しました。',
    shoppingListSortByName: '名前順',
    shoppingListSortByAdded: '追加日順',
    savedRecipesButtonTitle: '保存済みレシピ',
    openAddFoodModalButton: '食品追加',
    openShoppingListModalButton: '買い物リスト',
    confirmIconTitle: '削除を確認',
    cancelIconTitle: '削除をキャンセル',
    customRecipeSettingsTitle: "カスタムレシピ条件",
    cuisineLabel: "料理の種類",
    cuisineNone: "指定なし",
    cuisineEuropean: "ヨーロッパ料理",
    cuisineJapanese: "日本料理",
    cuisineSichuan: "四川料理",
    cuisineCantonese: "広東料理",
    cuisineTaiwanese: "台湾料理",
    cuisineOther: "その他",
    customCuisinePlaceholder: "料理の種類名を入力",
    avoidIngredientsLabel: "食べたくない食材（カンマ区切り）",
    avoidIngredientsPlaceholder: "例：パクチー、玉ねぎ",
    generateCustomRecipesButton: "カスタムレシピを生成",
    saveAndGenerateButton: "保存してこの設定で生成",
    saveSettingsButton: "設定を保存",
    generateWithoutSavingButton: "この設定で生成（保存しない）",
    generateMoreRecipesButton: "さらにレシピの提案を取得",
    recipesWithThisItemButton: "この食材でレシピを生成",
    promptAvoidRecipes: '以下のレシピを再度推奨しないでください：{recipeNames}。',
    promptTargetItemRecipe: '冷蔵庫に「{targetItemName}」があります。主にこの食材を使ったレシピを2つ考案してください。冷蔵庫にある他の期限切れでない食材も使用できます：{otherIngredients}。',
    themeDropdownTitle: 'テーマを選択',
  }
};


// ModalWrapper Component (Generic Modal Structure)
const ModalWrapper = React.memo(({ show, onClose, children, title, titleIcon: TitleIcon, zIndexClass = 'z-50', currentTheme }) => {
    const [internalShow, setInternalShow] = useState(false);
    const modalContentRef = useRef(null);
    const prevShowRef = useRef(show);

    const handleModalContentClick = (e) => e.stopPropagation();
    
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') onClose();
        };
        if (show) { 
            document.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [show, onClose]);

    useEffect(() => {
        let timer;
        if (show && !prevShowRef.current) { // Animate in
            setInternalShow(false); 
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            modalContentRef.current?.offsetHeight; 
            timer = setTimeout(() => {
                setInternalShow(true);
            }, 10);
        } else if (!show && prevShowRef.current) { // Animate out
            setInternalShow(false);
        } else if (show && prevShowRef.current && !internalShow) { 
            setInternalShow(true); 
        }
        prevShowRef.current = show;
        return () => clearTimeout(timer);
    }, [show, internalShow]); 

    if (!show && !internalShow) return null;

    return (
        <div 
            className={`fixed inset-0 bg-black flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${zIndexClass}
                        ${(show && internalShow) ? 'bg-black/60 dark:bg-black/80 opacity-100' : 'bg-opacity-0 opacity-0'}
                        ${!show && !internalShow ? 'pointer-events-none' : ''} 
                      `} 
            onClick={onClose}
        >
            <div 
                ref={modalContentRef}
                onClick={handleModalContentClick}
                className={`shadow-xl rounded-xl p-6 backdrop-blur-md max-w-lg w-full max-h-[90vh] overflow-y-auto
                            transform transition-all duration-300 ease-out
                            ${(show && internalShow) ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-4'} 
                            ${currentTheme === 'dark' ? 'bg-slate-800/95 text-slate-200' : 'bg-white/95 text-slate-800'}
                            ${currentTheme === 'ocean' ? 'bg-cyan-50/95 text-slate-800' : ''}
                            ${currentTheme === 'forest' ? 'bg-emerald-50/95 text-slate-800' : ''}
                          `}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-2xl font-semibold flex items-center 
                        ${currentTheme === 'dark' ? 'text-sky-400' : 'text-sky-600'}
                        ${currentTheme === 'ocean' ? 'text-cyan-600' : ''}
                        ${currentTheme === 'forest' ? 'text-green-600' : ''}
                    `}>
                        {TitleIcon && <TitleIcon className="mr-2 h-7 w-7" />}
                        {title}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <XCircle size={28} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
  });

// AddFoodModal Component
const AddFoodModal = ({ initialData, isEditingMode, onSave, onClose, currentTheme, t, showTemporaryMessageInApp }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [manualExpiryDate, setManualExpiryDate] = useState('');
    const itemNameRef = useRef(null);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setQuantity(initialData.quantity || '');
            setPurchaseDate(initialData.purchaseDate || new Date().toISOString().split('T')[0]);
            setManualExpiryDate(initialData.manualExpiryDate || '');
        } else {
            setName('');
            setQuantity('');
            setPurchaseDate(new Date().toISOString().split('T')[0]);
            setManualExpiryDate('');
        }
        if (itemNameRef.current) {
            itemNameRef.current.focus();
        }
    }, [initialData]);

    useEffect(() => {
        if (itemNameRef.current) {
            itemNameRef.current.focus();
        }
    }, []);


    const handleSubmit = () => {
        if (!name.trim() || !quantity.trim()) {
            showTemporaryMessageInApp('error', t('errorFormValidation'));
            return;
        }
        onSave({
            name: name.trim(),
            quantity: quantity.trim(),
            purchaseDate,
            manualExpiryDate: manualExpiryDate || null,
        });
    };

    return (
        <ModalWrapper show={true} onClose={onClose} title={isEditingMode ? t('editFoodTitle') : t('addFoodTitle')} titleIcon={PlusCircle} zIndexClass="z-50" currentTheme={currentTheme}>
            <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                    <label htmlFor="modalItemName" className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('foodNameLabel')}</label>
                    <input 
                        id="modalItemName" 
                        ref={itemNameRef}
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder={t('foodNamePlaceholder')} 
                        className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-sky-500 focus:border-sky-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`} />
                </div>
                <div>
                    <label htmlFor="modalItemQuantity" className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('quantityLabel')}</label>
                    <input id="modalItemQuantity" type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={t('quantityPlaceholder')}
                        className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-sky-500 focus:border-sky-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`} />
                </div>
                <div>
                    <label htmlFor="modalItemPurchaseDate" className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('purchaseDateLabel')}</label>
                    <input id="modalItemPurchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
                        className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-sky-500 focus:border-sky-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`} />
                </div>
                <div>
                    <label htmlFor="modalItemManualExpiryDate" className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('manualExpiryDateLabel')}</label>
                    <input id="modalItemManualExpiryDate" type="date" value={manualExpiryDate} onChange={(e) => setManualExpiryDate(e.target.value)} placeholder={t('manualExpiryDatePlaceholder')}
                        className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-sky-500 focus:border-sky-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`} />
                </div>
            </div>
            <button onClick={handleSubmit}
                className={`w-full font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center text-lg 
                ${currentTheme === 'dark' ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}
                ${currentTheme === 'ocean' ? 'bg-cyan-500 hover:bg-cyan-600 text-white' : ''}
                ${currentTheme === 'forest' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
            `}>
                {isEditingMode ? <Save className="mr-2 h-5 w-5" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
                {isEditingMode ? t('saveButton') : t('addButton')}
            </button>
        </ModalWrapper>
    );
};

// ShoppingListModal Component
const ShoppingListModal = ({ onAddItem, onClose, currentTheme, t, shoppingListSortCriteria, shoppingListSortDirection, handleSaveSettingsInApp, sortedShoppingListItems, toggleShoppingItemPurchasedInApp, handleDeleteShoppingItemInApp, handleAddShoppingItemToFridgeInApp, showTemporaryMessageInApp }) => {
    const [itemName, setItemName] = useState('');
    const [itemUnit, setItemUnit] = useState('');
    const itemNameRef = useRef(null);
    const [pendingDeleteId, setPendingDeleteId] = useState(null); 

    useEffect(() => {
        if (itemNameRef.current) {
            itemNameRef.current.focus();
        }
    }, []); 

    const handleSubmit = () => {
        if (!itemName.trim()) {
            showTemporaryMessageInApp('error', t('shoppingItemNameLabel') + ' ' + t('errorFormValidation').split(' ')[1]); 
            return;
        }
        onAddItem({ name: itemName.trim(), unit: itemUnit.trim() });
        setItemName('');
        setItemUnit('');
        if (itemNameRef.current) { 
            itemNameRef.current.focus();
        }
    };
    
    return (
        <ModalWrapper show={true} onClose={() => { setPendingDeleteId(null); onClose();}} title={t('shoppingListTitle')} titleIcon={ListPlus} zIndexClass="z-50" currentTheme={currentTheme}>
            <div className="flex justify-end items-center gap-1 mb-4">
                 <select 
                    value={shoppingListSortCriteria} 
                    onChange={(e) => handleSaveSettingsInApp({shoppingListSortCriteria: e.target.value}, true)} // isThemeChangeOnly = true (or new flag)
                    className={`p-1.5 border rounded-lg shadow-sm focus:ring-1 transition text-xs
                    ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-teal-500 focus:border-teal-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500 bg-white'}`}
                >
                    <option value="addedAt">{t('shoppingListSortByAdded')}</option>
                    <option value="name">{t('shoppingListSortByName')}</option>
                </select>
                <button 
                    onClick={() => handleSaveSettingsInApp({shoppingListSortDirection: shoppingListSortDirection === 'asc' ? 'desc' : 'asc'}, true)}
                    className={`p-1.5 border rounded-lg shadow-sm flex items-center justify-center transition
                        ${currentTheme === 'dark' ? 'border-slate-600 bg-slate-700 hover:bg-slate-600' : 'border-gray-300 bg-white hover:bg-gray-50'}
                    `}
                    title={shoppingListSortDirection === 'asc' ? t('sortDirectionDesc') : t('sortDirectionAsc')} 
                >
                    {shoppingListSortDirection === 'asc' ? <SortAsc size={16} className={currentTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'} /> : <SortDesc size={16} className={currentTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'} />}
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                    <label htmlFor="modalShoppingItemName" className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('shoppingItemNameLabel')}</label>
                    <input 
                        id="modalShoppingItemName" 
                        ref={itemNameRef}
                        type="text" value={itemName} 
                        onChange={(e) => setItemName(e.target.value)} 
                        placeholder={t('addShoppingItemPlaceholder')} 
                        className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-teal-500 focus:border-teal-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'}`} />
                </div>
                <div>
                    <label htmlFor="modalShoppingItemUnit" className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('shoppingItemUnitLabel')}</label>
                    <input id="modalShoppingItemUnit" type="text" value={itemUnit} onChange={(e) => setItemUnit(e.target.value)} placeholder={t('shoppingItemUnitPlaceholder')}
                    className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-teal-500 focus:border-teal-500' : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'}`} />
                </div>
            </div>
            <button onClick={handleSubmit}
                className={`w-full font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 text-lg
                ${currentTheme === 'dark' ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-teal-500 hover:bg-teal-600 text-white'}
                ${currentTheme === 'ocean' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                ${currentTheme === 'forest' ? 'bg-lime-500 hover:bg-lime-600 text-white' : ''}
                `}>
                <PlusCircle size={20} className="mr-2"/>{t('addShoppingItemButton')}
            </button>
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2 pr-2">
                {sortedShoppingListItems.length === 0 && <p className={`text-center py-4 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('emptyShoppingList')}</p>}
                {sortedShoppingListItems.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg 
                    ${item.purchased ? (currentTheme === 'dark' ? 'bg-slate-700 opacity-60' : 'bg-gray-100 opacity-60') : (currentTheme === 'dark' ? 'bg-slate-700' : 'bg-white shadow-sm')}
                `}>
                    <span className={`flex-grow ${item.purchased ? 'line-through ' : ''} ${item.purchased && (currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                    {item.name} {item.unit && `(${item.unit})`}
                    </span>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                    {item.purchased && (
                        <button onClick={() => handleAddShoppingItemToFridgeInApp(item)} title={t('addShoppingItemToFridge')}
                        className={`p-1 rounded ${currentTheme === 'dark' ? 'text-sky-400 hover:text-sky-300' : 'text-sky-500 hover:text-sky-700'}`}>
                        <PlusSquare size={18} />
                    </button>
                    )}
                    <button onClick={() => toggleShoppingItemPurchasedInApp(item)} title={item.purchased ? t('markAsNotPurchased') : t('markAsPurchased')}
                        className={`p-1 rounded ${item.purchased ? (currentTheme === 'dark' ? 'text-yellow-400 hover:text-yellow-300' : 'text-yellow-500 hover:text-yellow-600') : (currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}`}>
                        <CheckSquare size={20} />
                    </button>
                    {pendingDeleteId === item.id ? (
                        <>
                            <button onClick={() => { handleDeleteShoppingItemInApp(item.id); setPendingDeleteId(null); }} title={t('confirmIconTitle')}
                                className={`p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800`}>
                                <CheckCircle2 size={18} />
                            </button>
                            <button onClick={() => setPendingDeleteId(null)} title={t('cancelIconTitle')}
                                className={`p-1 rounded text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600`}>
                                <XCircle size={18} />
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setPendingDeleteId(item.id)} title={t('removeFromList')}
                            className={`p-1 rounded text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300`}>
                            <Trash2 size={18} />
                        </button>
                    )}
                    </div>
                </div>
                ))}
            </div>
        </ModalWrapper>
    );
};

// SelectIngredientsModal Component
const SelectIngredientsModal = ({ recipe, ingredientsForSelection, onClose, onConfirm, currentTheme, t, showTemporaryMessageInApp }) => {
    const [selections, setSelections] = useState({}); 

    useEffect(() => {
        setSelections({});
    }, [ingredientsForSelection]);


    const handleSelectionChange = (ingredientName, isChecked) => {
        setSelections(prev => ({ ...prev, [ingredientName]: isChecked }));
    };

    const handleConfirm = () => {
        const ingredientsToAdd = Object.keys(selections).filter(name => selections[name]);
        if (ingredientsToAdd.length === 0) {
            showTemporaryMessageInApp('info', t('noItemsSelected'));
            return; 
        }
        onConfirm(ingredientsToAdd); 
    };
    
    return (
        <ModalWrapper show={true} onClose={onClose} title={t('selectIngredientsModalTitle')} titleIcon={ListPlus} zIndexClass="z-[65]" currentTheme={currentTheme}>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {recipe && t('recipeIngredientsMissingInfo', { recipeName: recipe.recipeName })}
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6 pr-2">
                {ingredientsForSelection.map(ingredientName => (
                    <label key={ingredientName} className="flex items-center p-2 rounded-md hover:bg-sky-50 dark:hover:bg-slate-700 cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={!!selections[ingredientName]}
                            onChange={(e) => handleSelectionChange(ingredientName, e.target.checked)}
                            className="h-5 w-5 text-sky-600 border-gray-300 dark:border-gray-500 rounded focus:ring-sky-500 dark:bg-slate-600 dark:checked:bg-sky-500"
                        />
                        <span className="ml-3 text-gray-700 dark:text-gray-200">{ingredientName}</span>
                    </label>
                ))}
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={onClose} 
                    className={`w-full font-semibold py-2 px-4 rounded-lg shadow-md transition
                        ${currentTheme === 'dark' ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                >
                    {t('cancelButton')}
                </button>
                <button 
                    onClick={handleConfirm}
                    className={`w-full font-semibold py-2 px-4 rounded-lg shadow-md transition text-white
                        ${currentTheme === 'dark' ? 'bg-sky-600 hover:bg-sky-500' : 'bg-sky-500 hover:bg-sky-600'}`}
                >
                    <ListPlus size={18} className="mr-2"/>{t('confirmAddSelectedButton')}
                </button>
            </div>
        </ModalWrapper>
    );
};


// CustomRecipeSettingsModal Component
const CustomRecipeSettingsModal = ({ initialPrefs, show, onClose, onSavePrefs, onGenerateWithPrefs, onGenerateWithoutSaving, currentTheme, t }) => {
    const [selectedCuisine, setSelectedCuisine] = useState('cuisineNone');
    const [customCuisineInput, setCustomCuisineInput] = useState('');
    const [avoidIngredientsInput, setAvoidIngredientsInput] = useState('');

    useEffect(() => {
        if (initialPrefs) {
            setSelectedCuisine(initialPrefs.cuisineKey || 'cuisineNone'); 
            setCustomCuisineInput(initialPrefs.customCuisine || '');
            setAvoidIngredientsInput(initialPrefs.avoidIngredients || '');
        } else { 
            setSelectedCuisine('cuisineNone');
            setCustomCuisineInput('');
            setAvoidIngredientsInput('');
        }
    }, [initialPrefs, show]); 


    const cuisineOptions = [
        { value: 'cuisineNone', label: t('cuisineNone') },
        { value: 'cuisineEuropean', label: t('cuisineEuropean') },
        { value: 'cuisineJapanese', label: t('cuisineJapanese') },
        { value: 'cuisineSichuan', label: t('cuisineSichuan') },
        { value: 'cuisineCantonese', label: t('cuisineCantonese') },
        { value: 'cuisineTaiwanese', label: t('cuisineTaiwanese') },
        { value: 'cuisineOther', label: t('cuisineOther') },
    ];

    const getCurrentSettings = () => {
        const actualCuisineName = selectedCuisine === 'cuisineNone' ? '' : 
                                 (selectedCuisine === 'cuisineOther' ? customCuisineInput.trim() : t(selectedCuisine));
        return {
            cuisineKey: selectedCuisine, 
            cuisine: actualCuisineName, 
            customCuisine: selectedCuisine === 'cuisineOther' ? customCuisineInput.trim() : '',
            avoidIngredients: avoidIngredientsInput.trim(),
        };
    };

    const handleSave = () => {
        onSavePrefs(getCurrentSettings());
        onClose(); 
    };

    const handleSaveAndGenerate = () => {
        const currentSettings = getCurrentSettings();
        onSavePrefs(currentSettings); 
        onGenerateWithPrefs(currentSettings); 
        onClose();
    };
    
    const handleGenerateWithoutSaving = () => {
        const currentSettings = getCurrentSettings();
        onGenerateWithoutSaving(currentSettings);
        onClose();
    };
    
    return (
        <ModalWrapper show={show} onClose={onClose} title={t('customRecipeSettingsTitle')} titleIcon={SlidersHorizontal} zIndexClass="z-[55]" currentTheme={currentTheme}>
            <div className="space-y-4">
                <div>
                    <label className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('cuisineLabel')}</label>
                    <select 
                        value={selectedCuisine} 
                        onChange={(e) => setSelectedCuisine(e.target.value)}
                        className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-sky-500 focus:border-sky-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500 bg-white'}`}
                    >
                        {cuisineOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    {selectedCuisine === 'cuisineOther' && (
                        <input 
                            type="text"
                            value={customCuisineInput}
                            onChange={(e) => setCustomCuisineInput(e.target.value)}
                            placeholder={t('customCuisinePlaceholder')}
                            className={`mt-2 w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-sky-500 focus:border-sky-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`}
                        />
                    )}
                </div>
                <div>
                    <label htmlFor="avoidIngredients" className={`block text-sm font-medium mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('avoidIngredientsLabel')}</label>
                    <textarea
                        id="avoidIngredients"
                        value={avoidIngredientsInput}
                        onChange={(e) => setAvoidIngredientsInput(e.target.value)}
                        placeholder={t('avoidIngredientsPlaceholder')}
                        rows="3"
                        className={`w-full p-3 border rounded-lg shadow-sm focus:ring-2 transition ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-sky-500 focus:border-sky-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500'}`}
                    ></textarea>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                     <button onClick={handleSaveAndGenerate}
                        className={`w-full font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center text-lg 
                        ${currentTheme === 'dark' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}
                    `}>
                        <Brain className="mr-2 h-5 w-5" /> {t('saveAndGenerateButton')}
                    </button>
                    <button onClick={handleGenerateWithoutSaving}
                        className={`w-full font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center text-lg 
                        ${currentTheme === 'dark' ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}
                    `}>
                        <RefreshCw className="mr-2 h-5 w-5" /> {t('generateWithoutSavingButton')}
                    </button>
                    <button onClick={handleSave}
                        className={`w-full font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center text-lg 
                        ${currentTheme === 'dark' ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-400 hover:bg-gray-500 text-gray-800'}
                    `}>
                        <Save className="mr-2 h-5 w-5" /> {t('saveSettingsButton')}
                    </button>
                </div>
            </div>
        </ModalWrapper>
    );
};

// AlertMessage Component - Renders via Portal
const AlertMessage = ({ type, content, id }) => { 
    const [isVisible, setIsVisible] = useState(false);
  
    useEffect(() => {
      if (content && id) {
        setIsVisible(true);
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, 2700); // Duration before starting fade-out
        return () => clearTimeout(timer);
      } else if (!id) { 
          setIsVisible(false); 
      }
    }, [content, id]);
  
    if (!id && !isVisible) return null; 
  
    let bgColor, borderColor, textColor;
    switch (type) {
      case 'success': bgColor = 'bg-green-100 dark:bg-green-900'; borderColor = 'border-green-400 dark:border-green-600'; textColor = 'text-green-700 dark:text-green-300'; break;
      case 'error': bgColor = 'bg-red-100 dark:bg-red-900'; borderColor = 'border-red-400 dark:border-red-600'; textColor = 'text-red-700 dark:text-red-300'; break;
      default: bgColor = 'bg-blue-100 dark:bg-blue-900'; borderColor = 'border-blue-400 dark:border-blue-600'; textColor = 'text-blue-700 dark:text-blue-300'; break;
    }
  
    return (
      <div 
        key={id} 
        className={`fixed top-5 right-5 p-4 border rounded-md shadow-lg z-[1000] ${bgColor} ${borderColor} ${textColor} transition-all duration-300 ease-in-out
                    ${(isVisible && id) ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`} 
        role="alert"
        style={{ transformOrigin: 'right center' }} 
      >
        <p>{content}</p>
      </div>
    );
  };

// ActionButtonsGroup Component
const ActionButtonsGroup = ({ t, handleOpenAddFoodModal, setShowShoppingListModal, setShowSavedRecipesModal, currentTheme, isMobileLayout }) => {
    const buttonBaseClasses = `font-semibold rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50`;
    const mobileSpecificClasses = isMobileLayout ? "flex-1 p-2" : "py-2 px-3 mr-2 text-sm";


    const getThemeButtonClasses = (buttonType) => {
        let bgColor = 'bg-sky-500';
        let hoverBgColor = 'hover:bg-sky-600';

        if (buttonType === 'shopping') {
            bgColor = 'bg-teal-500'; hoverBgColor = 'hover:bg-teal-600';
        } else if (buttonType === 'saved') {
            bgColor = 'bg-purple-500'; hoverBgColor = 'hover:bg-purple-600';
        }

        if (currentTheme === 'dark') {
            bgColor = buttonType === 'add' ? 'bg-sky-600' : buttonType === 'shopping' ? 'bg-teal-600' : 'bg-purple-600';
            hoverBgColor = buttonType === 'add' ? 'hover:bg-sky-500' : buttonType === 'shopping' ? 'hover:bg-teal-500' : 'hover:bg-purple-500';
        } else if (currentTheme === 'ocean') {
            bgColor = buttonType === 'add' ? 'bg-cyan-500' : buttonType === 'shopping' ? 'bg-blue-500' : 'bg-indigo-500';
            hoverBgColor = buttonType === 'add' ? 'hover:bg-cyan-600' : buttonType === 'shopping' ? 'hover:bg-blue-600' : 'hover:bg-indigo-600';
        } else if (currentTheme === 'forest') {
            bgColor = buttonType === 'add' ? 'bg-emerald-500' : buttonType === 'shopping' ? 'bg-lime-600' : 'bg-fuchsia-500';
            hoverBgColor = buttonType === 'add' ? 'hover:bg-emerald-600' : buttonType === 'shopping' ? 'hover:bg-lime-700' : 'hover:bg-fuchsia-600';
        }
        return `${bgColor} ${hoverBgColor} text-white`;
    };

    const iconSize = isMobileLayout ? 20 : 16;

    return (
        <>
            <button
                onClick={() => handleOpenAddFoodModal(null, false)}
                className={`${buttonBaseClasses} ${mobileSpecificClasses} ${getThemeButtonClasses('add')}`}
                title={isMobileLayout ? t('openAddFoodModalButton') : ''}
            >
                <PlusCircle size={iconSize} />
                <span className={isMobileLayout ? "sr-only" : "ml-1.5"}>{t('openAddFoodModalButton')}</span>
            </button>
            <button
                onClick={() => setShowShoppingListModal(true)}
                className={`${buttonBaseClasses} ${mobileSpecificClasses} ${getThemeButtonClasses('shopping')}`}
                title={isMobileLayout ? t('openShoppingListModalButton') : ''}
            >
                <ShoppingCart size={iconSize} />
                <span className={isMobileLayout ? "sr-only" : "ml-1.5"}>{t('openShoppingListModalButton')}</span>
            </button>
            <button
                onClick={() => setShowSavedRecipesModal(true)}
                className={`${buttonBaseClasses} ${mobileSpecificClasses} ${getThemeButtonClasses('saved')}`}
                title={isMobileLayout ? t('savedRecipesButtonTitle') : ''}
            >
                <Bookmark size={iconSize} />
                <span className={isMobileLayout ? "sr-only" : "ml-1.5"}>{t('savedRecipesButtonTitle')}</span>
            </button>
        </>
    );
};


const App = () => {
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [currentLanguage, setCurrentLanguage] = useState('zh-TW');
  const [currentTheme, setCurrentTheme] = useState('light');
  const [lastNonDarkTheme, setLastNonDarkTheme] = useState('light');
  const [userSettingsLoaded, setUserSettingsLoaded] = useState(false);

  const [foodItems, setFoodItems] = useState([]);
  const [shoppingListItems, setShoppingListItems] = useState([]);
  
  const [shoppingListSortCriteria, setShoppingListSortCriteria] = useState('addedAt');
  const [shoppingListSortDirection, setShoppingListSortDirection] = useState('desc');

  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [recipes, setRecipes] = useState([]); 
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '', id: null }); 
  const messageTimeoutRef = useRef(null);
  const [alertPortalNode, setAlertPortalNode] = useState(null);


  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sortCriteria, setSortCriteria] = useState('expiryDate'); 
  const [sortDirection, setSortDirection] = useState('asc');

  const [showSelectIngredientsModal, setShowSelectIngredientsModal] = useState(false);
  const [ingredientsForSelection, setIngredientsForSelection] = useState([]); 
  
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [showSavedRecipesModal, setShowSavedRecipesModal] = useState(false);
  const [viewingSavedRecipe, setViewingSavedRecipe] = useState(null); 

  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [addFoodModalInitialData, setAddFoodModalInitialData] = useState(null);
  const [addFoodModalIsEditing, setAddFoodModalIsEditing] = useState(false);

  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [fridgeItemIdPendingDelete, setFridgeItemIdPendingDelete] = useState(null); 
  
  const [showCustomRecipeSettingsModal, setShowCustomRecipeSettingsModal] = useState(false);
  const [customRecipeUserPrefs, setCustomRecipeUserPrefs] = useState({ cuisineKey: 'cuisineNone', customCuisine: '', avoidIngredients: '' });
  const [recipeContextForShoppingList, setRecipeContextForShoppingList] = useState({ recipe: null, source: null });
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeDropdownRef = useRef(null);

  // State to store the context of the last recipe query
  const [recipeQueryContext, setRecipeQueryContext] = useState({
    customSettings: null,
    targetItemName: null,
  });


  useEffect(() => {
    const portalDiv = document.createElement('div');
    portalDiv.id = 'alert-messages-portal';
    document.body.appendChild(portalDiv);
    setAlertPortalNode(portalDiv);

    return () => {
      if (portalDiv && portalDiv.parentNode === document.body) {
        document.body.removeChild(portalDiv);
      }
      setAlertPortalNode(null);
    };
  }, []); 


  const t = useCallback((key, replacements = {}) => {
    let translation = translations[currentLanguage]?.[key] || translations['en-US']?.[key] || key;
    Object.keys(replacements).forEach(pKey => {
      translation = translation.replace(`{${pKey}}`, replacements[pKey]);
    });
    return translation;
  }, [currentLanguage]);

  useEffect(() => {
    if (!isAuthReady || !userId || !userSettingsLoaded) return;
    const prefsDocRef = doc(db, `artifacts/${appId}/users/${userId}/settings`, 'customRecipePrefs');
    const unsubscribe = onSnapshot(prefsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setCustomRecipeUserPrefs(docSnap.data());
        } else {
            setCustomRecipeUserPrefs({ cuisineKey: 'cuisineNone', customCuisine: '', avoidIngredients: '' });
        }
    }, (error) => {
        console.error("讀取自訂食譜偏好錯誤: ", error);
        setCustomRecipeUserPrefs({ cuisineKey: 'cuisineNone', customCuisine: '', avoidIngredients: '' }); 
    });
    return () => unsubscribe();
  }, [isAuthReady, userId, userSettingsLoaded, appId]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Firebase Auth 錯誤:", error.message, error);
          showTemporaryMessage('error', t('errorAuth'));
          setUserId(crypto.randomUUID()); 
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [t]); 

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    const settingsDocRef = doc(db, `artifacts/${appId}/users/${userId}/settings`, 'preferences');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const settings = docSnap.data();
        if (settings.language) setCurrentLanguage(settings.language);
        if (settings.theme) setCurrentTheme(settings.theme);
        if (settings.lastNonDarkTheme) setLastNonDarkTheme(settings.lastNonDarkTheme);
        else if (settings.theme && settings.theme !== 'dark') setLastNonDarkTheme(settings.theme);
        else if (!settings.theme || (settings.theme === 'dark' && !settings.lastNonDarkTheme) ) setLastNonDarkTheme('light');
        if (settings.sortCriteria) setSortCriteria(settings.sortCriteria);
        if (settings.sortDirection) setSortDirection(settings.sortDirection);
        if (settings.shoppingListSortCriteria) setShoppingListSortCriteria(settings.shoppingListSortCriteria);
        if (settings.shoppingListSortDirection) setShoppingListSortDirection(settings.shoppingListSortDirection);
      } else {
        setCurrentTheme('light');
        setLastNonDarkTheme('light');
      }
      setUserSettingsLoaded(true); 
    }, (error) => {
      console.error("讀取使用者設定錯誤: ", error.message, error);
      setUserSettingsLoaded(true); 
      setCurrentTheme('light'); 
      setLastNonDarkTheme('light');
    });
    return () => unsubscribe();
  }, [isAuthReady, userId, appId]); 

  useEffect(() => {
    document.documentElement.className = currentTheme;
  }, [currentTheme]);

  useEffect(() => {
    if (!isAuthReady || !userId || !userSettingsLoaded) return;
    const itemsCollectionPath = `artifacts/${appId}/users/${userId}/fridgeItems`;
    const q = query(collection(db, itemsCollectionPath)); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((docSnap) => { 
        const data = docSnap.data();
        items.push({ 
          id: docSnap.id, 
          ...data,
          purchaseDate: data.purchaseDate instanceof Timestamp ? data.purchaseDate.toDate().toISOString().split('T')[0] : data.purchaseDate,
          manualExpiryDate: data.manualExpiryDate || '', 
          addedAt: data.addedAt instanceof Timestamp ? data.addedAt.toDate() : (data.addedAt ? new Date(data.addedAt) : new Date(0)) 
        });
      });
      setFoodItems(items);
    }, (error) => {
      console.error("讀取 Firestore 食物資料錯誤: ", error.message, error);
      showTemporaryMessage('error', t('errorLoadData'));
    });
    return () => unsubscribe();
  }, [isAuthReady, userId, appId, userSettingsLoaded, t]); 

  useEffect(() => {
    if (!isAuthReady || !userId || !userSettingsLoaded) return;
    const shoppingListCollectionPath = `artifacts/${appId}/users/${userId}/shoppingList`;
    const q = query(collection(db, shoppingListCollectionPath)); 
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((docSnap) => { 
        const data = docSnap.data();
        items.push({ 
            id: docSnap.id, 
            ...data,
            addedAt: data.addedAt instanceof Timestamp ? data.addedAt.toDate() : (data.addedAt ? new Date(data.addedAt) : new Date(0))
        });
      });
      setShoppingListItems(items);
    }, (error) => {
      console.error("讀取購物清單錯誤: ", error.message, error);
      showTemporaryMessage('error', t('errorLoadShoppingList'));
    });
    return () => unsubscribe();
  }, [isAuthReady, userId, appId, userSettingsLoaded, t]); 

  useEffect(() => {
    if (!isAuthReady || !userId || !userSettingsLoaded) return;
    const savedRecipesPath = `artifacts/${appId}/users/${userId}/savedRecipes`;
    const q = query(collection(db, savedRecipesPath), firestoreOrderBy("savedAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const recipesData = [];
        querySnapshot.forEach((docSnap) => { 
            recipesData.push({ id: docSnap.id, ...docSnap.data() });
        });
        setSavedRecipes(recipesData);
    }, (error) => {
        console.error("讀取已存食譜錯誤: ", error.message, error);
        showTemporaryMessage('error', '讀取已存食譜失敗。'); 
    });
    return () => unsubscribe();
  }, [isAuthReady, userId, appId, userSettingsLoaded]);


  const showTemporaryMessage = (type, content) => {
    if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
    }
    const messageId = Date.now(); 
    setMessage({ type, content, id: messageId });
    messageTimeoutRef.current = setTimeout(() => {
        setMessage(prevMessage => (prevMessage.id === messageId ? { type: '', content: '', id: null } : prevMessage));
    }, 3000);
  };

  const handleSaveSettings = async (settingsToSave, isThemeChangeOnly = false) => {
    if (!isAuthReady || !userId) return;
    
    const newSettings = { ...settingsToSave };
    let actualChangesMade = false;

    if (newSettings.language !== undefined && newSettings.language !== currentLanguage) actualChangesMade = true;
    if (newSettings.sortCriteria !== undefined && newSettings.sortCriteria !== sortCriteria) actualChangesMade = true;
    if (newSettings.sortDirection !== undefined && newSettings.sortDirection !== sortDirection) actualChangesMade = true;
    if (newSettings.shoppingListSortCriteria !== undefined && newSettings.shoppingListSortCriteria !== shoppingListSortCriteria) actualChangesMade = true;
    if (newSettings.shoppingListSortDirection !== undefined && newSettings.shoppingListSortDirection !== shoppingListSortDirection) actualChangesMade = true;
    
    if (newSettings.theme !== undefined && newSettings.theme !== currentTheme) actualChangesMade = true;
    if (newSettings.lastNonDarkTheme !== undefined && newSettings.lastNonDarkTheme !== lastNonDarkTheme) actualChangesMade = true;


    if (newSettings.theme !== undefined) {
        setCurrentTheme(newSettings.theme); 
        if (newSettings.theme !== 'dark') {
            setLastNonDarkTheme(newSettings.theme); 
            newSettings.lastNonDarkTheme = newSettings.theme; 
        } else {
            newSettings.lastNonDarkTheme = settingsToSave.lastNonDarkTheme || lastNonDarkTheme;
        }
    }
    if (newSettings.language !== undefined) setCurrentLanguage(newSettings.language);
    if (newSettings.sortCriteria !== undefined) setSortCriteria(newSettings.sortCriteria);
    if (newSettings.sortDirection !== undefined) setSortDirection(newSettings.sortDirection);
    if (newSettings.shoppingListSortCriteria !== undefined) setShoppingListSortCriteria(newSettings.shoppingListSortCriteria);
    if (newSettings.shoppingListSortDirection !== undefined) setShoppingListSortDirection(newSettings.shoppingListSortDirection);

    if (actualChangesMade) {
        const settingsDocRef = doc(db, `artifacts/${appId}/users/${userId}/settings`, 'preferences');
        try {
        await setDoc(settingsDocRef, newSettings , { merge: true });
        if (!isThemeChangeOnly) { 
            showTemporaryMessage('success', t('successSettingsSaved'));
        }
        if (showSettingsModal && !isThemeChangeOnly) setShowSettingsModal(false); 
        } catch (error) {
        console.error("儲存設定錯誤: ", error.message, error);
        showTemporaryMessage('error', '儲存設定失敗。'); 
        }
    } else if (!isThemeChangeOnly) { 
        showTemporaryMessage('info', t('infoNoSettingsChanged'));
        if (showSettingsModal) setShowSettingsModal(false);
    }
  };
  
  const handleChangeThemeDirectly = (newThemeChoice) => {
    let newLastNonDark = lastNonDarkTheme;
    if (newThemeChoice !== 'dark' && currentTheme === 'dark') { 
        newLastNonDark = newThemeChoice; 
    } else if (newThemeChoice !== 'dark') { 
        newLastNonDark = newThemeChoice;
    } else { 
        newLastNonDark = currentTheme !== 'dark' ? currentTheme : lastNonDarkTheme;
    }
    handleSaveSettings({ theme: newThemeChoice, lastNonDarkTheme: newLastNonDark }, true);
    setShowThemeDropdown(false);
  };

  const toggleDarkMode = async () => {
    const newTheme = currentTheme === 'dark' ? (lastNonDarkTheme || 'light') : 'dark';
    let newLastNonDark = lastNonDarkTheme;
    if (newTheme === 'dark' && currentTheme !== 'dark') { 
        newLastNonDark = currentTheme; 
    }
    handleSaveSettings({ theme: newTheme, lastNonDarkTheme: newLastNonDark }, true);
  };

  const handleOpenAddFoodModal = (itemData = null, isEditing = false) => {
    setAddFoodModalInitialData(itemData);
    setAddFoodModalIsEditing(isEditing);
    setShowAddFoodModal(true);
  };

  const handleCloseAddFoodModal = () => {
    setShowAddFoodModal(false);
  };

  const handleSaveFoodItem = async (foodDataFromModal) => {
    if (!isAuthReady || !userId) return;
    
    try {
        if (addFoodModalIsEditing && addFoodModalInitialData?.id) { 
            const itemIdToUpdate = addFoodModalInitialData.id;
            const originalItem = foodItems.find(item => item.id === itemIdToUpdate); 
            let updates = { ...foodDataFromModal };
            if (originalItem) {
                const nameChanged = originalItem.name !== foodDataFromModal.name;
                const purchaseDateChanged = originalItem.purchaseDate !== foodDataFromModal.purchaseDate;
                if (nameChanged || purchaseDateChanged) {
                    updates.storageLocation = '';
                    updates.shelfLifeDays = null;
                }
            }
            const itemDocRef = doc(db, `artifacts/${appId}/users/${userId}/fridgeItems`, itemIdToUpdate);
            await updateDoc(itemDocRef, updates);
            showTemporaryMessage('success', t('successUpdateItem'));
        } else { 
            const itemsCollectionPath = `artifacts/${appId}/users/${userId}/fridgeItems`;
            await addDoc(collection(db, itemsCollectionPath), {
                ...foodDataFromModal,
                storageLocation: '', 
                shelfLifeDays: null,
                addedAt: serverTimestamp()
            });
            showTemporaryMessage('success', `${foodDataFromModal.name} ${t('successAddItem')}`);
        }
        handleCloseAddFoodModal();
    } catch (error) {
        console.error("儲存食物項目錯誤: ", error.message, error);
        showTemporaryMessage('error', addFoodModalIsEditing ? t('errorUpdateItem') : t('errorAddItem'));
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!isAuthReady || !userId) return;
    try {
      const itemDocRef = doc(db, `artifacts/${appId}/users/${userId}/fridgeItems`, itemId);
      await deleteDoc(itemDocRef);
      showTemporaryMessage('success', t('successDeleteItem'));
    } catch (error) {
      console.error("刪除食物項目錯誤: ", error.message, error);
      showTemporaryMessage('error', t('errorDeleteItem'));
    }
  };
  
  const startEditItem = (item) => {
    handleOpenAddFoodModal(item, true);
  };
  
  const getAIStorageAdvice = async (item) => {
    if (!isAuthReady || !userId) return;
    setIsLoadingAI(true);
    try {
      const languageName = currentLanguage === 'zh-TW' ? '繁體中文' : currentLanguage === 'en-US' ? 'English' : '日本語';
      const prompt = `針對食物「${item.name}」，建議最佳的${t('promptStorageLocation')}以及預估的${t('promptShelfLifeDays')}。${t('promptProvideInLanguage', {language: languageName})} 請以JSON格式回覆，包含 'storageLocation' (字串) 和 'shelfLifeDays' (整數) 兩個欄位。`;
      
      // const payload = {
      //   contents: [{ role: "user", parts: [{ text: prompt }] }],
      //   generationConfig: {
      //     responseMimeType: "application/json",
      //     responseSchema: {
      //       type: "OBJECT",
      //       properties: {
      //         storageLocation: { type: "STRING" },
      //         shelfLifeDays: { type: "INTEGER" }
      //       },
      //       required: ["storageLocation", "shelfLifeDays"]
      //     }
      //   }
      // };
      // const apiKey = ""; 
      // const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      // const response = await fetch(apiUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      const model = getGenerativeModel(ai, {
        model: "gemini-2.5-flash-preview-05-20",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              storageLocation: { type: "STRING" },
              shelfLifeDays: { type: "INTEGER" }
            },
            required: ["storageLocation", "shelfLifeDays"]
          }
        }
      })
      let response = await model.generateContent(prompt)

      if (!response.ok) {
        let errorDetailMessage = response.statusText;
        try { const errorData = await response.json(); errorDetailMessage = errorData?.error?.message || JSON.stringify(errorData); } 
        catch (e) { try { errorDetailMessage = await response.text(); } catch (textE) { /* Fallback */ } }
        console.error(`AI 儲存建議 API 錯誤 (${response.status}):`, errorDetailMessage, response);
        throw new Error(`${t('errorGetAIAdvice')} (HTTP ${response.status}) - ${errorDetailMessage}`);
      }
      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const advice = JSON.parse(result.candidates[0].content.parts[0].text);
        const itemDocRef = doc(db, `artifacts/${appId}/users/${userId}/fridgeItems`, item.id);
        await updateDoc(itemDocRef, {
          storageLocation: advice.storageLocation,
          shelfLifeDays: advice.shelfLifeDays,
        });
        showTemporaryMessage('success', `${t('successUpdateAIAdvice')} ${item.name}！`);
      } else {
        console.error("AI 儲存建議 API 回應格式不符預期:", result);
        throw new Error('AI 回應格式不符預期。');
      }
    } catch (error) {
      console.error("獲取 AI 儲存建議時發生錯誤:", error.message, "\nStack:", error.stack, "\nFull error object:", error);
      showTemporaryMessage('error', `${t('errorGetAIAdvice')} ${item.name}：${error.message || t('unknownError')}`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const calculateExpiryDate = (purchaseDateStr, shelfLifeDays, manualExpiryDateStr) => {
    if (manualExpiryDateStr) {
        const manualDate = new Date(manualExpiryDateStr);
        manualDate.setHours(0,0,0,0);
        return manualDate;
    }
    if (!purchaseDateStr || shelfLifeDays == null) return null;
    const purchaseDate = new Date(purchaseDateStr);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setDate(purchaseDate.getDate() + shelfLifeDays);
    expiryDate.setHours(0,0,0,0);
    return expiryDate;
  };

  const getExpiryStatus = (item) => {
    const expiryDate = calculateExpiryDate(item.purchaseDate, item.shelfLifeDays, item.manualExpiryDate);
    if (!expiryDate) return null;
    
    const today = new Date();
    today.setHours(0,0,0,0); 

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: t('expired'), days: diffDays, color: 'text-red-500 dark:text-red-400', icon: <AlertTriangle size={16} className="mr-1"/> };
    if (diffDays === 0) return { text: t('expiredToday'), days: diffDays, color: 'text-orange-500 dark:text-orange-400', icon: <Bell size={16} className="mr-1"/> };
    if (diffDays <= 3) return { text: `${t('expiresIn')} ${diffDays} ${t('daysExpireUnit')}`, days: diffDays, color: 'text-yellow-500 dark:text-yellow-400', icon: <Clock size={16} className="mr-1"/> };
    return null; 
  };

  const getAIRecipes = async (options = {}) => {
    const {
        directCustomSettings, 
        append = false,         
        directTargetItemName, 
        existingRecipeNames = []
    } = options;

    if (!isAuthReady || !userId) return;
    
    const nonExpiredItems = sortedFoodItems.filter(item => {
        const expiryDate = calculateExpiryDate(item.purchaseDate, item.shelfLifeDays, item.manualExpiryDate);
        return expiryDate ? expiryDate.getTime() >= new Date().setHours(0,0,0,0) : true; 
    });

    if (nonExpiredItems.length === 0 && (directTargetItemName === undefined || directTargetItemName === null)) { 
      showTemporaryMessage('info', t('infoNoIngredientsForRecipe'));
      return;
    }
    setIsLoadingRecipes(true);
    if (!append) {
        setRecipes([]); 
    }

    let settingsToUseForPrompt;
    let targetItemForPrompt;

    if (append) { // For "Generate More"
        settingsToUseForPrompt = recipeQueryContext.customSettings;
        targetItemForPrompt = recipeQueryContext.targetItemName;
    } else { // For a new search
        targetItemForPrompt = directTargetItemName !== undefined ? directTargetItemName : null;
        if (directCustomSettings !== undefined) { // Settings explicitly passed (e.g. from CustomRecipeSettingsModal)
            settingsToUseForPrompt = directCustomSettings; 
        } else { // No direct settings, use global user prefs (for general AI button or targeted item search)
            settingsToUseForPrompt = customRecipeUserPrefs; 
        }
        
        // Update context for *this new search*
        setRecipeQueryContext({
            customSettings: settingsToUseForPrompt,
            targetItemName: targetItemForPrompt
        });
    }
    
    try {
      const ingredientList = nonExpiredItems.map(item => item.name).join('、');
      const languageName = currentLanguage === 'zh-TW' ? '繁體中文' : currentLanguage === 'en-US' ? 'English' : '日本語';
      
      let prompt;
      if (targetItemForPrompt) {
          const otherIngredients = nonExpiredItems.filter(item => item.name !== targetItemForPrompt).map(item => item.name).join('、') || '無';
          prompt = t('promptTargetItemRecipe', { targetItemName: targetItemForPrompt, otherIngredients });
          // Apply custom settings even for targeted item search
          if (settingsToUseForPrompt?.cuisine && settingsToUseForPrompt.cuisine.toLowerCase() !== t('cuisineNone').toLowerCase() && settingsToUseForPrompt.cuisine.toLowerCase() !== 'any' && settingsToUseForPrompt.cuisine.toLowerCase() !== '指定なし') {
              prompt += ` 菜系為「${settingsToUseForPrompt.cuisine}」。`;
          }
          if (settingsToUseForPrompt?.avoidIngredients) {
              prompt += ` 請避免使用以下食材：${settingsToUseForPrompt.avoidIngredients}。`;
          }
      } else {
          prompt = `我的冰箱裡有以下未過期食材：${ingredientList}。`;
          if (settingsToUseForPrompt?.cuisine && settingsToUseForPrompt.cuisine.toLowerCase() !== t('cuisineNone').toLowerCase() && settingsToUseForPrompt.cuisine.toLowerCase() !== 'any' && settingsToUseForPrompt.cuisine.toLowerCase() !== '指定なし') {
              prompt += ` 請根據這些食材設計 2 道「${settingsToUseForPrompt.cuisine}」食譜。`;
          } else {
              prompt += ` 請根據這些食材設計 2 道食譜。`;
          }
          if (settingsToUseForPrompt?.avoidIngredients) {
              prompt += ` 請避免使用以下食材：${settingsToUseForPrompt.avoidIngredients}。`;
          }
      }
      
      if (existingRecipeNames.length > 0) {
        prompt += ` ${t('promptAvoidRecipes', { recipeNames: existingRecipeNames.join('、') })}`;
      }

      prompt += `每道食譜請包含${t('promptRecipeName')} ('recipeName': STRING)、${t('promptIngredients')} ('ingredients': ARRAY of STRING)、以及詳細的${t('promptSteps')} ('steps': ARRAY of STRING)。${t('promptProvideInLanguage', {language: languageName})} 請以JSON格式回覆一個包含食譜陣列的物件，根物件鍵名為 'recipes'。`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              recipes: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    recipeName: { type: "STRING" },
                    ingredients: { type: "ARRAY", items: { type: "STRING" } },
                    steps: { type: "ARRAY", items: { type: "STRING" } }
                  },
                  required: ["recipeName", "ingredients", "steps"]
                }
              }
            },
            required: ["recipes"]
          }
        }
      };
      // const apiKey = "";
      // const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      
      const model = getGenerativeModel(ai, {
        model: "gemini-2.5-flash-preview-05-20",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              recipes: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    recipeName: { type: "STRING" },
                    ingredients: { type: "ARRAY", items: { type: "STRING" } },
                    steps: { type: "ARRAY", items: { type: "STRING" } }
                  },
                  required: ["recipeName", "ingredients", "steps"]
                }
              }
            },
            required: ["storageLocation", "shelfLifeDays"]
          }
        }
      })
      let response = await model.generateContent(prompt)

      // const response = await fetch(apiUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      if (!response.ok) {
        let errorDetailMessage = response.statusText;
        try { const errorData = await response.json(); errorDetailMessage = errorData?.error?.message || JSON.stringify(errorData); } 
        catch (e) { try { errorDetailMessage = await response.text(); } catch (textE) { /* Fallback */ } }
        console.error(`AI 食譜 API 錯誤 (${response.status}):`, errorDetailMessage, response);
        throw new Error(`${t('errorGetAIRecipes')} (HTTP ${response.status}) - ${errorDetailMessage}`);
      }
      const result = await response.json();
      if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
        const parsedResult = JSON.parse(result.candidates[0].content.parts[0].text);
        if (parsedResult.recipes && parsedResult.recipes.length > 0) {
          setRecipes(prevRecipes => append ? [...prevRecipes, ...parsedResult.recipes] : parsedResult.recipes);
          if (!showRecipeModal) setShowRecipeModal(true); 
        } else {
          if (!append || recipes.length === 0) { 
             showTemporaryMessage('info', t('infoAINoRecipes'));
          }
        }
      } else {
        console.error("AI 食譜 API 回應格式不符預期:", result);
        if (!append || recipes.length === 0) {
            showTemporaryMessage('info', t('infoAINoRecipes'));
        }
      }
    } catch (error) {
      console.error("獲取 AI 食譜建議時發生錯誤:", error.message, "\nStack:", error.stack, "\nFull error object:", error);
      showTemporaryMessage('error', `${t('errorGetAIRecipes')}：${error.message || t('unknownError')}`);
      if (!append) setRecipes([]);
    } finally {
      setIsLoadingRecipes(false);
    }
  };
  
  const handleSaveCustomRecipePrefs = async (prefs) => {
    if (!isAuthReady || !userId) return;
    const prefsDocRef = doc(db, `artifacts/${appId}/users/${userId}/settings`, 'customRecipePrefs');
    try {
        await setDoc(prefsDocRef, prefs, { merge: true });
        setCustomRecipeUserPrefs(prefs); 
        showTemporaryMessage('success', t('successSaveCustomPrefs')); 
    } catch (error) {
        console.error("儲存自訂食譜偏好錯誤: ", error);
        showTemporaryMessage('error', t('errorSaveCustomPrefs')); 
    }
  };


  const handleAddShoppingItem = async (itemData) => { 
    if (!isAuthReady || !userId) return;
    try {
      const listPath = `artifacts/${appId}/users/${userId}/shoppingList`;
      await addDoc(collection(db, listPath), {
        name: itemData.name,
        unit: itemData.unit || null,
        purchased: false,
        addedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("新增購物項目錯誤: ", error.message, error);
      showTemporaryMessage('error', t('errorAddShoppingItem'));
    }
  };

  const toggleShoppingItemPurchased = async (item) => {
    if (!isAuthReady || !userId) return;
    try {
      const itemDocRef = doc(db, `artifacts/${appId}/users/${userId}/shoppingList`, item.id);
      await updateDoc(itemDocRef, { purchased: !item.purchased });
    } catch (error) {
      console.error("更新購物項目狀態錯誤: ", error.message, error);
      showTemporaryMessage('error', t('errorUpdateShoppingItem'));
    }
  };

  const handleDeleteShoppingItem = async (itemId) => {
     if (!isAuthReady || !userId) return;
    try {
      const itemDocRef = doc(db, `artifacts/${appId}/users/${userId}/shoppingList`, itemId);
      await deleteDoc(itemDocRef);
    } catch (error) {
      console.error("刪除購物項目錯誤: ", error.message, error);
      showTemporaryMessage('error', t('errorDeleteShoppingItem'));
    }
  };

  const handleAddShoppingItemToFridge = (shoppingItem) => {
    const initialDataForNewFoodItem = {
        name: shoppingItem.name,
        quantity: shoppingItem.unit || '', 
        purchaseDate: new Date().toISOString().split('T')[0], 
        manualExpiryDate: '' 
    };
    setShowShoppingListModal(false); 
    handleOpenAddFoodModal(initialDataForNewFoodItem, false); 
    showTemporaryMessage('info', t('shoppingItemAddedToFridgeForm', {name: shoppingItem.name}));
  };

  const promptSelectIngredientsForShoppingList = (recipe, source) => {
    const fridgeItemNamesLower = foodItems.map(item => item.name.toLowerCase());
    const shoppingListItemNamesLower = shoppingListItems.map(item => item.name.toLowerCase());
    
    const missing = recipe.ingredients.filter(ingName => {
        const lowerIngName = ingName.toLowerCase();
        const inFridgeAndNotExpired = foodItems.some(fItem => {
            if (fItem.name.toLowerCase() === lowerIngName) {
                const expiry = calculateExpiryDate(fItem.purchaseDate, fItem.shelfLifeDays, fItem.manualExpiryDate);
                return expiry ? expiry.getTime() >= new Date().setHours(0,0,0,0) : true;
            }
            return false;
        });
        return !inFridgeAndNotExpired && !shoppingListItemNamesLower.includes(lowerIngName);
    });

    if (missing.length === 0) {
        showTemporaryMessage('success', t('noMissingIngredients'));
        return; 
    }

    setIngredientsForSelection(missing);
    setRecipeContextForShoppingList({ recipe: recipe, source: source }); 
    setShowSelectIngredientsModal(true); 
  };

  const handleConfirmAddSelectedToShoppingList = async (ingredientsToAdd) => {
    if (!isAuthReady || !userId) return;

    let itemsAddedCount = 0;
    for (const ingredientName of ingredientsToAdd) {
        try {
            const listPath = `artifacts/${appId}/users/${userId}/shoppingList`;
            await addDoc(collection(db, listPath), {
                name: ingredientName, unit: '', purchased: false, addedAt: serverTimestamp()
            });
            itemsAddedCount++;
        } catch (error){
            console.error(`新增 ${ingredientName} 到購物清單失敗: `, error.message, error);
            showTemporaryMessage('error', `新增 ${ingredientName} 失敗`); 
        }
    }

    if (itemsAddedCount > 0) {
        showTemporaryMessage('success', t('ingredientsAddedToShoppingList'));
    }
    
    setShowSelectIngredientsModal(false); 
  };
  
  const handleCloseSelectIngredientsModal = () => {
    setShowSelectIngredientsModal(false);
    setIngredientsForSelection([]); 
    setRecipeContextForShoppingList({ recipe: null, source: null }); 
  };


  const handleSaveRecipe = async (recipeToSave) => {
    if (!isAuthReady || !userId) return;
    const isAlreadySaved = savedRecipes.some(r => r.recipeName === recipeToSave.recipeName && JSON.stringify(r.ingredients) === JSON.stringify(recipeToSave.ingredients) && JSON.stringify(r.steps) === JSON.stringify(recipeToSave.steps));
    if (isAlreadySaved) {
        showTemporaryMessage('info', t('recipeAlreadySaved', {recipeName: recipeToSave.recipeName}));
        return;
    }
    try {
        const savedRecipesPath = `artifacts/${appId}/users/${userId}/savedRecipes`;
        await addDoc(collection(db, savedRecipesPath), { ...recipeToSave, savedAt: serverTimestamp() });
        showTemporaryMessage('success', t('recipeSavedSuccess', {recipeName: recipeToSave.recipeName}));
    } catch (error) {
        console.error("儲存食譜錯誤: ", error.message, error);
        showTemporaryMessage('error', t('errorSavingRecipe', {recipeName: recipeToSave.recipeName}));
    }
  };

  const handleDeleteSavedRecipe = async (recipeId, recipeName) => {
    if (!isAuthReady || !userId) return;
    try {
        const recipeDocRef = doc(db, `artifacts/${appId}/users/${userId}/savedRecipes`, recipeId);
        await deleteDoc(recipeDocRef);
        showTemporaryMessage('success', t('savedRecipeDeletedSuccess', {recipeName}));
        if (viewingSavedRecipe && viewingSavedRecipe.id === recipeId) setViewingSavedRecipe(null); 
    } catch (error) {
        console.error("刪除已存食譜錯誤: ", error.message, error);
        showTemporaryMessage('error', t('errorDeletingSavedRecipe', {recipeName}));
    }
  };

  const sortedFoodItems = useMemo(() => {
    let items = [...foodItems];
    items.sort((a, b) => {
      let valA, valB;
      switch (sortCriteria) {
        case 'expiryDate':
          valA = calculateExpiryDate(a.purchaseDate, a.shelfLifeDays, a.manualExpiryDate);
          valB = calculateExpiryDate(b.purchaseDate, b.shelfLifeDays, b.manualExpiryDate);
          if (!valA && !valB) return 0;
          if (!valA) return 1; 
          if (!valB) return -1;
          return valA.getTime() - valB.getTime();
        case 'purchaseDate':
          valA = new Date(a.purchaseDate);
          valB = new Date(b.purchaseDate);
          return valA.getTime() - valB.getTime();
        case 'name':
          return a.name.localeCompare(b.name, currentLanguage.startsWith('zh') ? 'zh-Hans-CN' : currentLanguage);
        case 'addedAt':
          valA = new Date(a.addedAt || 0); 
          valB = new Date(b.addedAt || 0);
          return valA.getTime() - valB.getTime();
        default: return 0;
      }
    });
    if (sortDirection === 'desc') items.reverse();
    return items;
  }, [foodItems, sortCriteria, sortDirection, currentLanguage]);

  const sortedShoppingListItems = useMemo(() => {
    let items = [...shoppingListItems];
    items.sort((a,b) => {
        let valA, valB;
        switch(shoppingListSortCriteria) {
            case 'name':
                valA = a.name; valB = b.name;
                return valA.localeCompare(valB, currentLanguage.startsWith('zh') ? 'zh-Hans-CN' : currentLanguage);
            case 'addedAt': default:
                valA = a.addedAt instanceof Timestamp ? a.addedAt.toDate() : new Date(a.addedAt || 0);
                valB = b.addedAt instanceof Timestamp ? b.addedAt.toDate() : new Date(b.addedAt || 0);
                return valA.getTime() - valB.getTime();
        }
    });
    if (shoppingListSortDirection === 'desc') items.reverse();
    return items;
  }, [shoppingListItems, shoppingListSortCriteria, shoppingListSortDirection, currentLanguage]);
  
  const RecipeModalContent = ({ recipes: currentRecipes, onClose }) => { 
    const handleGenerateMore = () => {
        const existingNames = currentRecipes.map(r => r.recipeName);
        getAIRecipes({
            directCustomSettings: recipeQueryContext.customSettings, 
            directTargetItemName: recipeQueryContext.targetItemName,
            append: true,
            existingRecipeNames: existingNames
        });
    };

    return (
        <>
          <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
            {currentRecipes.map((recipe, index) => (
              <div key={`${recipe.recipeName}-${index}`} className="mb-6 p-4 border border-sky-200 dark:border-sky-700 rounded-lg bg-sky-50 dark:bg-slate-700">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-sky-600 dark:text-sky-300 mb-2">{recipe.recipeName}</h3>
                  <button 
                      onClick={() => handleSaveRecipe(recipe)}
                      disabled={savedRecipes.some(r => r.recipeName === recipe.recipeName && JSON.stringify(r.ingredients) === JSON.stringify(recipe.ingredients) && JSON.stringify(r.steps) === JSON.stringify(recipe.steps))}
                      className={`p-1.5 rounded-md text-sm transition-colors disabled:opacity-50
                          ${savedRecipes.some(r => r.recipeName === recipe.recipeName && JSON.stringify(r.ingredients) === JSON.stringify(recipe.ingredients) && JSON.stringify(r.steps) === JSON.stringify(recipe.steps)) 
                              ? (currentTheme === 'dark' ? 'text-green-400' : 'text-green-600') 
                              : (currentTheme === 'dark' ? 'text-slate-400 hover:text-sky-400 hover:bg-slate-600' : 'text-slate-500 hover:text-sky-600 hover:bg-sky-100')}
                      `}
                      title={savedRecipes.some(r => r.recipeName === recipe.recipeName && JSON.stringify(r.ingredients) === JSON.stringify(recipe.ingredients) && JSON.stringify(r.steps) === JSON.stringify(recipe.steps)) ? t('recipeAlreadySaved', {recipeName: recipe.recipeName}) : t('saveRecipeButton')}
                  >
                    {savedRecipes.some(r => r.recipeName === recipe.recipeName && JSON.stringify(r.ingredients) === JSON.stringify(recipe.ingredients) && JSON.stringify(r.steps) === JSON.stringify(recipe.steps)) ? <CheckCircle2 size={20}/> : <Save size={20}/>}
                  </button>
                </div>
                <div className="mb-3">
                  <h4 className="font-medium text-sky-500 dark:text-sky-400 flex items-center"><Sparkles size={18} className="mr-1 text-yellow-500" />{t('recipeIngredientsLabel')}:</h4>
                  <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                    {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sky-500 dark:text-sky-400 flex items-center"><Utensils size={18} className="mr-1" />{t('recipeStepsLabel')}:</h4>
                  <ol className="list-decimal list-inside ml-4 text-gray-700 dark:text-gray-300 space-y-1">
                    {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                </div>
                <button 
                  onClick={() => promptSelectIngredientsForShoppingList(recipe, 'ai')}
                  className={`mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-150 ease-in-out flex items-center justify-center text-sm
                    ${currentTheme === 'dark' ? 'bg-teal-600 hover:bg-teal-500' : ''}
                  `}
                >
                  <ListPlus size={18} className="mr-2"/> {t('addMissingToShoppingListButton')}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={onClose} className="w-1/2 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out flex items-center justify-center">
                <XCircle size={20} className="mr-2"/> {t('closeRecipeButton')}
            </button>
            <button 
                onClick={handleGenerateMore} 
                disabled={isLoadingRecipes}
                className={`w-1/2 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50
                ${currentTheme === 'dark' ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}
            `}>
                {isLoadingRecipes ? ( <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : ( <RefreshCw className="mr-2 h-5 w-5" /> )}
                {t('generateMoreRecipesButton')}
            </button>
          </div>
        </>
    );
  };

  const SavedRecipesModalContent = () => {
    const [pendingDeleteId, setPendingDeleteId] = useState(null); 

    const ViewSingleSavedRecipeModal = ({ recipe, onClose }) => {
        return (
            <ModalWrapper show={!!recipe} onClose={onClose} title={recipe?.recipeName || ''} titleIcon={Eye} zIndexClass="z-[60]" currentTheme={currentTheme}>
                {recipe && (
                    <>
                        <div className="mb-3">
                            <h4 className="font-medium text-sky-500 dark:text-sky-400 flex items-center"><Sparkles size={18} className="mr-1 text-yellow-500" />{t('recipeIngredientsLabel')}:</h4>
                            <ul className="list-disc list-inside ml-4 text-gray-700 dark:text-gray-300">
                                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-sky-500 dark:text-sky-400 flex items-center"><Utensils size={18} className="mr-1" />{t('recipeStepsLabel')}:</h4>
                            <ol className="list-decimal list-inside ml-4 text-gray-700 dark:text-gray-300 space-y-1">
                                {recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
                            </ol>
                        </div>
                        <button 
                            onClick={() => { promptSelectIngredientsForShoppingList(recipe, 'saved');}} 
                            className={`mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-3 rounded-lg transition duration-150 ease-in-out flex items-center justify-center text-sm
                            ${currentTheme === 'dark' ? 'bg-teal-600 hover:bg-teal-500' : ''}
                            `}
                        >
                            <ListPlus size={18} className="mr-2"/> {t('addMissingToShoppingListButton')}
                        </button>
                        <button onClick={onClose} className="mt-3 w-full bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition">
                            {t('closeRecipeButton')}
                        </button>
                    </>
                )}
            </ModalWrapper>
        );
    };
    
    return (
        <>
            {savedRecipes.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('emptySavedRecipes')}</p>
            ) : (
                <div className="space-y-3">
                    {savedRecipes.map(recipe => (
                        <div key={recipe.id} className="p-3 border border-sky-200 dark:border-sky-700 rounded-lg bg-sky-50 dark:bg-slate-700 flex justify-between items-center">
                            <span className="text-lg text-sky-700 dark:text-sky-300">{recipe.recipeName}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setViewingSavedRecipe(recipe)} title={t('viewRecipeButton')}
                                    className={`p-2 rounded-md hover:bg-sky-100 dark:hover:bg-slate-600 text-sky-600 dark:text-sky-400 transition-colors`}>
                                    <Eye size={20} />
                                </button>
                                {pendingDeleteId === recipe.id ? (
                                    <>
                                        <button onClick={() => { handleDeleteSavedRecipe(recipe.id, recipe.recipeName); setPendingDeleteId(null); }} title={t('confirmIconTitle')}
                                            className={`p-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-800 transition-colors`}>
                                            <CheckCircle2 size={20} />
                                        </button>
                                        <button onClick={() => setPendingDeleteId(null)} title={t('cancelIconTitle')}
                                            className={`p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors`}>
                                            <XCircle size={20} />
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setPendingDeleteId(recipe.id)} title={t('deleteSavedRecipeButton')}
                                        className={`p-2 rounded-md text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 transition-colors`}>
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        {viewingSavedRecipe && <ViewSingleSavedRecipeModal recipe={viewingSavedRecipe} onClose={() => setViewingSavedRecipe(null)} />}
        </>
    );
  };

  const SettingsModalContent = () => {
    const [initialSettings, setInitialSettings] = useState({});
    const [tempLang, setTempLang] = useState(currentLanguage);
    const [tempSort, setTempSort] = useState(sortCriteria);
    const [tempSortDir, setTempSortDir] = useState(sortDirection);
    const [tempShopSort, setTempShopSort] = useState(shoppingListSortCriteria);
    const [tempShopSortDir, setTempShopSortDir] = useState(shoppingListSortDirection);
    const [hasChanged, setHasChanged] = useState(false);

    useEffect(() => {
        setInitialSettings({
            language: currentLanguage,
            sortCriteria: sortCriteria,
            sortDirection: sortDirection,
            shoppingListSortCriteria: shoppingListSortCriteria,
            shoppingListSortDirection: shoppingListSortDirection,
        });
        setTempLang(currentLanguage);
        setTempSort(sortCriteria);
        setTempSortDir(sortDirection);
        setTempShopSort(shoppingListSortCriteria);
        setTempShopSortDir(shoppingListSortDirection);
        setHasChanged(false); 
    }, [showSettingsModal]); 

    useEffect(() => {
        const changed = 
            tempLang !== initialSettings.language ||
            tempSort !== initialSettings.sortCriteria ||
            tempSortDir !== initialSettings.sortDirection ||
            tempShopSort !== initialSettings.shoppingListSortCriteria ||
            tempShopSortDir !== initialSettings.shoppingListSortDirection;
        setHasChanged(changed);
    }, [tempLang, tempSort, tempSortDir, tempShopSort, tempShopSortDir, initialSettings]);


    const handleLocalSave = () => {
        if (hasChanged) {
            handleSaveSettings({
                language: tempLang,
                sortCriteria: tempSort,
                sortDirection: tempSortDir,
                shoppingListSortCriteria: tempShopSort,
                shoppingListSortDirection: tempShopSortDir,
            }, false); 
        } else {
            showTemporaryMessage('info', t('infoNoSettingsChanged'));
            setShowSettingsModal(false); 
        }
    };

    return (
        <>
            <div className="mb-4">
                <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('languageLabel')}</label>
                <select 
                id="languageSelect" 
                value={tempLang} 
                onChange={(e) => setTempLang(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                >
                <option value="zh-TW">繁體中文</option>
                <option value="en-US">English</option>
                <option value="ja-JP">日本語</option>
                </select>
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fridgeContentsTitle')} {t('sortLabel')}</label>
                <div className="flex gap-2">
                    <select 
                    value={tempSort} 
                    onChange={(e) => setTempSort(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                    >
                    <option value="expiryDate">{t('sortByExpiryDate')}</option>
                    <option value="purchaseDate">{t('sortByPurchaseDate')}</option>
                    <option value="name">{t('sortByName')}</option>
                    <option value="addedAt">{t('sortByAddedDate')}</option>
                    </select>
                    <button 
                        onClick={() => setTempSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className={`p-3 border dark:border-gray-600 rounded-lg shadow-sm flex items-center justify-center transition
                            ${tempSortDir === 'asc' ? (currentTheme === 'dark' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-700') : (currentTheme === 'dark' ? 'bg-slate-600' : 'bg-gray-200')}
                        `}
                        title={tempSortDir === 'asc' ? t('sortDirectionAsc') : t('sortDirectionDesc')}
                    >
                        {tempSortDir === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
                    </button>
                </div>
            </div>
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('shoppingListTitle')} {t('sortLabel')}</label>
                <div className="flex gap-2">
                    <select 
                    value={tempShopSort} 
                    onChange={(e) => setTempShopSort(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                    >
                    <option value="addedAt">{t('shoppingListSortByAdded')}</option>
                    <option value="name">{t('shoppingListSortByName')}</option>
                    </select>
                    <button 
                        onClick={() => setTempShopSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className={`p-3 border dark:border-gray-600 rounded-lg shadow-sm flex items-center justify-center transition
                            ${tempShopSortDir === 'asc' ? (currentTheme === 'dark' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-700') : (currentTheme === 'dark' ? 'bg-slate-600' : 'bg-gray-200')}
                        `}
                        title={tempShopSortDir === 'asc' ? t('sortDirectionAsc') : t('sortDirectionDesc')}
                    >
                        {tempShopSortDir === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
                    </button>
                </div>
            </div>
            <button 
                onClick={handleLocalSave}
                disabled={!hasChanged}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center text-lg disabled:opacity-50 disabled:hover:bg-sky-500"
            >
                <Save className="mr-2 h-5 w-5" /> {t('saveButton')}
            </button>
        </>
    );
  };

  if (!isAuthReady || !userSettingsLoaded) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${currentTheme === 'dark' ? 'bg-slate-900 text-sky-400' : 'bg-gradient-to-br from-sky-100 to-blue-200 text-sky-700'}`}>
        <svg className="animate-spin h-12 w-12 text-sky-600 dark:text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl font-semibold">{t('loadingFridge')}</p>
        {userId && <p className="text-sm mt-2">{t('userIdLabel')}: {userId}</p>}
      </div>
    );
  }

  return (
    <>
      {alertPortalNode && message.id && createPortal(
        <AlertMessage type={message.type} content={message.content} id={message.id} />,
        alertPortalNode
      )}
      
      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 
        ${currentTheme === 'light' ? 'bg-gradient-to-br from-sky-100 to-blue-200 text-slate-800' : ''}
        ${currentTheme === 'dark' ? 'bg-slate-900 text-slate-200' : ''}
        ${currentTheme === 'ocean' ? 'bg-gradient-to-br from-cyan-100 to-blue-300 text-slate-800' : ''}
        ${currentTheme === 'forest' ? 'bg-gradient-to-br from-emerald-100 to-green-300 text-slate-800' : ''}
      `}>
        
        {showSettingsModal && (
            <ModalWrapper show={showSettingsModal} onClose={() => setShowSettingsModal(false)} title={t('settingsTitle')} titleIcon={Settings} zIndexClass="z-[55]" currentTheme={currentTheme}>
                <SettingsModalContent />
            </ModalWrapper>
        )}
        {showRecipeModal && (
            <ModalWrapper show={showRecipeModal && recipes.length > 0} onClose={() => setShowRecipeModal(false)} title={t('recipeModalTitle')} titleIcon={CookingPot} zIndexClass="z-40" currentTheme={currentTheme}>
                <RecipeModalContent recipes={recipes} onClose={() => setShowRecipeModal(false)} />
            </ModalWrapper>
        )}
        
        {showSelectIngredientsModal && recipeContextForShoppingList.recipe && (
          <SelectIngredientsModal 
              recipe={recipeContextForShoppingList.recipe}
              ingredientsForSelection={ingredientsForSelection}
              onClose={handleCloseSelectIngredientsModal}
              onConfirm={handleConfirmAddSelectedToShoppingList}
              currentTheme={currentTheme}
              t={t}
              showTemporaryMessageInApp={showTemporaryMessage}
          />
        )}

        {showSavedRecipesModal && (
            <ModalWrapper show={showSavedRecipesModal} onClose={() => { setViewingSavedRecipe(null); setShowSavedRecipesModal(false);}} title={t('savedRecipesTitle')} titleIcon={Bookmark} zIndexClass="z-50" currentTheme={currentTheme}>
                <SavedRecipesModalContent />
            </ModalWrapper>
        )}
        
        {showCustomRecipeSettingsModal && (
          <CustomRecipeSettingsModal
              initialPrefs={customRecipeUserPrefs}
              show={showCustomRecipeSettingsModal}
              onClose={() => setShowCustomRecipeSettingsModal(false)}
              onSavePrefs={handleSaveCustomRecipePrefs}
              onGenerateWithPrefs={(settings) => getAIRecipes({ directCustomSettings: settings, append: false, directTargetItemName: null })}
              onGenerateWithoutSaving={(settings) => getAIRecipes({ directCustomSettings: settings, append: false, directTargetItemName: null })}
              currentTheme={currentTheme}
              t={t}
          />
        )}

        {showAddFoodModal && (
          <AddFoodModal 
              initialData={addFoodModalInitialData}
              isEditingMode={addFoodModalIsEditing}
              onSave={handleSaveFoodItem}
              onClose={handleCloseAddFoodModal}
              currentTheme={currentTheme}
              t={t}
              showTemporaryMessageInApp={showTemporaryMessage}
          />
        )}

        {showShoppingListModal && (
          <ShoppingListModal
              onAddItem={handleAddShoppingItem}
              onClose={() => setShowShoppingListModal(false)}
              currentTheme={currentTheme}
              t={t}
              shoppingListSortCriteria={shoppingListSortCriteria}
              shoppingListSortDirection={shoppingListSortDirection}
              handleSaveSettingsInApp={handleSaveSettings} 
              sortedShoppingListItems={sortedShoppingListItems}
              toggleShoppingItemPurchasedInApp={toggleShoppingItemPurchased}
              handleDeleteShoppingItemInApp={handleDeleteShoppingItem}
              handleAddShoppingItemToFridgeInApp={handleAddShoppingItemToFridge}
              showTemporaryMessageInApp={showTemporaryMessage}
          />
        )}

        {/* Non-Sticky Title Area */}
        <div className={`text-center pt-6 pb-3 sm:pt-8 sm:pb-4
          ${currentTheme === 'dark' ? 'bg-slate-900' : 'bg-sky-100'} 
          ${currentTheme === 'ocean' ? 'bg-cyan-100' : ''} 
          ${currentTheme === 'forest' ? 'bg-emerald-100' : ''}
        `}>
          <h1 className={`text-3xl sm:text-4xl font-bold drop-shadow-md 
            ${currentTheme === 'dark' ? 'text-sky-400' : 'text-sky-700'}
            ${currentTheme === 'ocean' ? 'text-cyan-700' : ''}
            ${currentTheme === 'forest' ? 'text-green-700' : ''}
          `}>
            {t('appName')}
          </h1>
          {userId && <p className={`text-xs mt-1 ${currentTheme === 'dark' ? 'text-sky-500' : 'text-sky-600'}`}>{t('userIdLabel')}: {userId}</p>}
        </div>
        
        {/* Sticky Header for Action Buttons (Desktop) and Settings (All) */}
        <header className={`flex items-center justify-between sticky top-0 z-30 shadow-sm px-4 py-2
          ${currentTheme === 'dark' ? 'bg-slate-900' : 'bg-sky-100'}
          ${currentTheme === 'ocean' ? 'bg-cyan-100' : ''}
          ${currentTheme === 'forest' ? 'bg-emerald-100' : ''}
        `}>
          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex sm:items-center sm:space-x-2">
            <ActionButtonsGroup
              t={t}
              handleOpenAddFoodModal={handleOpenAddFoodModal}
              setShowShoppingListModal={setShowShoppingListModal}
              setShowSavedRecipesModal={setShowSavedRecipesModal}
              currentTheme={currentTheme}
              isMobileLayout={false}
            />
          </div>
          
          {/* Settings/Theme Buttons (Right Aligned) */}
          <div className="flex items-center space-x-1 sm:space-x-2 relative" ref={themeDropdownRef}>
            <button 
                onClick={toggleDarkMode} 
                className={`p-2 rounded-full
                ${currentTheme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-sky-200'}
                transition-colors`}
                title={currentTheme === 'dark' ? t('lightTheme') : t('darkTheme')}
            >
                {currentTheme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button
              onClick={() => setShowThemeDropdown(prev => !prev)}
              className={`p-2 rounded-full transition-colors
                  ${currentTheme === 'dark' ? 'text-indigo-300 hover:bg-slate-700' : 'text-indigo-600 hover:bg-sky-200'}
              `}
              title={t('themeDropdownTitle')}
              >
              <Palette size={22} />
              </button>
              {showThemeDropdown && (
                  <div className={`absolute top-full right-0 mt-2 w-36 rounded-md shadow-lg py-1 z-50
                      ${currentTheme === 'dark' ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 ring-1 ring-black ring-opacity-5'}
                  `}>
                      {['light', 'ocean', 'forest'].map(themeOpt => (
                          <button
                              key={themeOpt}
                              onClick={() => handleChangeThemeDirectly(themeOpt)}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-opacity-20
                                  ${currentTheme === themeOpt ? 
                                      (currentTheme === 'dark' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700') : 
                                      (currentTheme === 'dark' ? 'hover:bg-slate-600' : 'hover:bg-gray-100')}
                              `}
                          >
                              {t(themeOpt + 'Theme')}
                          </button>
                      ))}
                  </div>
              )}
            <button 
                onClick={() => setShowSettingsModal(true)} 
                className={`p-2 rounded-full
                ${currentTheme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-sky-200'}
                transition-colors`}
                title={t('settingsTitle')}
            >
                <Settings size={22} />
            </button>
          </div>
        </header>

        {/* Sticky Action Buttons Bar for Mobile (Below Settings Header) */}
        <div className={`sm:hidden sticky top-12 z-20 flex justify-around space-x-2 py-2 px-4
          ${currentTheme === 'dark' ? 'bg-slate-800/90' : 'bg-sky-50/90'} 
          border-b ${currentTheme === 'dark' ? 'border-slate-700' : 'border-sky-200'}
          shadow-md backdrop-blur-sm
        `}>
          <ActionButtonsGroup 
                t={t} 
                handleOpenAddFoodModal={handleOpenAddFoodModal} 
                setShowShoppingListModal={setShowShoppingListModal} 
                setShowSavedRecipesModal={setShowSavedRecipesModal} 
                currentTheme={currentTheme}
                isMobileLayout={true} 
            />
        </div>
        
        {/* Main Content Area */}
        <div className="p-4 sm:p-6 md:p-8">
          <div className={`shadow-xl rounded-xl p-6 max-w-4xl mx-auto backdrop-blur-sm 
            ${currentTheme === 'dark' ? 'bg-slate-800/70' : 'bg-white/70'}
            ${currentTheme === 'ocean' ? 'bg-cyan-50/70' : ''}
            ${currentTheme === 'forest' ? 'bg-emerald-50/70' : ''}
          `}>
            {/* This section for desktop action buttons is now removed as they are in the sticky header */}
            {/* <div className="hidden sm:flex sm:justify-start sm:mb-6"> ... </div> */}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className={`text-2xl font-semibold flex items-center 
                ${currentTheme === 'dark' ? 'text-sky-400' : 'text-sky-600'}
                ${currentTheme === 'ocean' ? 'text-cyan-600' : ''}
                ${currentTheme === 'forest' ? 'text-green-600' : ''}
              `}><Package className="mr-2 h-7 w-7" />{t('fridgeContentsTitle')}</h2>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="sortCriteriaSelect" className="sr-only">{t('sortLabel')}</label>
                    <select 
                        id="sortCriteriaSelect"
                        value={sortCriteria} 
                        onChange={(e) => handleSaveSettings({sortCriteria: e.target.value}, true)} 
                        className={`flex-grow sm:w-auto p-2.5 border rounded-lg shadow-sm focus:ring-2 transition text-sm
                        ${currentTheme === 'dark' ? 'bg-slate-700 border-slate-600 text-white focus:ring-sky-500 focus:border-sky-500' : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500 bg-white'}`}
                    >
                        <option value="expiryDate">{t('sortByExpiryDate')}</option>
                        <option value="purchaseDate">{t('sortByPurchaseDate')}</option>
                        <option value="name">{t('sortByName')}</option>
                        <option value="addedAt">{t('sortByAddedDate')}</option>
                    </select>
                    <button 
                        onClick={() => handleSaveSettings({sortDirection: sortDirection === 'asc' ? 'desc' : 'asc'}, true)} 
                        className={`p-2.5 border rounded-lg shadow-sm flex items-center justify-center transition
                            ${currentTheme === 'dark' ? 'border-slate-600 bg-slate-700 hover:bg-slate-600' : 'border-gray-300 bg-white hover:bg-gray-50'}
                        `}
                        title={sortDirection === 'asc' ? t('sortDirectionDesc') : t('sortDirectionAsc')} 
                    >
                        {sortDirection === 'asc' ? <SortAsc size={20} className={currentTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'} /> : <SortDesc size={20} className={currentTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'} />}
                    </button>
                </div>
                <div className="flex items-stretch w-full sm:w-auto"> 
                    <button onClick={() => getAIRecipes({ append: false, directCustomSettings: customRecipeUserPrefs, directTargetItemName: null })} 
                        disabled={isLoadingAI || isLoadingRecipes || sortedFoodItems.filter(item => { const exp = calculateExpiryDate(item.purchaseDate, item.shelfLifeDays, item.manualExpiryDate); return exp ? exp.getTime() >= new Date().setHours(0,0,0,0) : true; }).length === 0}
                        className={`w-full sm:w-auto font-semibold py-2.5 px-3 rounded-l-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center text-md disabled:opacity-50 
                        ${currentTheme === 'dark' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}
                        ${currentTheme === 'ocean' ? 'bg-teal-500 hover:bg-teal-600 text-white' : ''}
                        ${currentTheme === 'forest' ? 'bg-lime-500 hover:bg-lime-600 text-white' : ''}
                    `}>
                        {isLoadingRecipes && !showCustomRecipeSettingsModal && !recipes.length ? ( <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : ( <Utensils className="mr-2 h-5 w-5" /> )}
                        {t('aiRecipeButton')}
                    </button>
                    <button onClick={() => setShowCustomRecipeSettingsModal(true)} disabled={isLoadingAI || isLoadingRecipes}
                        title={t('customRecipeSettingsButtonTitle')}
                        className={`py-2.5 px-3 rounded-r-lg shadow-md hover:shadow-lg transition duration-150 ease-in-out flex items-center justify-center text-md disabled:opacity-50 border-l ${
                            currentTheme === 'dark' 
                              ? 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-800' 
                              : 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-700'
                          }
                          ${currentTheme === 'ocean' ? (currentTheme === 'dark' ? 'bg-blue-700 hover:bg-blue-600 border-blue-800' : 'bg-blue-600 hover:bg-blue-700 border-blue-700') : ''}
                          ${currentTheme === 'forest' ? (currentTheme === 'dark' ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-800' : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700') : ''}
                      `}>
                        {isLoadingRecipes && showCustomRecipeSettingsModal ? ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : (<SlidersHorizontal size={20}/>)}
                    </button>
                </div>
              </div>
          </div>

          {sortedFoodItems.length === 0 && !isLoadingAI && ( <p className={`text-center py-4 ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('emptyFridge')}</p> )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedFoodItems.map((item) => {
              const expiryStatus = getExpiryStatus(item);
              const actualExpiryDate = calculateExpiryDate(item.purchaseDate, item.shelfLifeDays, item.manualExpiryDate);
              return (
              <div key={item.id} className={`p-4 rounded-lg shadow-md border flex flex-col
                ${currentTheme === 'dark' ? `bg-slate-700 ${expiryStatus?.days < 0 ? 'border-red-500' : expiryStatus?.days <=3 ? 'border-yellow-500' : 'border-slate-600'}` : `bg-sky-50 ${expiryStatus?.days < 0 ? 'border-red-300 bg-red-50' : expiryStatus?.days <=3 ? 'border-yellow-300 bg-yellow-50' : 'border-sky-200'}`}
                ${currentTheme === 'ocean' ? `bg-cyan-100 ${expiryStatus?.days < 0 ? 'border-red-400 bg-red-100' : expiryStatus?.days <=3 ? 'border-orange-400 bg-orange-100' : 'border-cyan-300'}` : ''}
                ${currentTheme === 'forest' ? `bg-emerald-100 ${expiryStatus?.days < 0 ? 'border-red-400 bg-red-100' : expiryStatus?.days <=3 ? 'border-amber-400 bg-amber-100' : 'border-emerald-300'}` : ''}
              `}>
                  <>
                    <div className="flex-grow">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
                          <h3 className={`text-lg font-semibold ${currentTheme === 'dark' ? 'text-sky-300' : 'text-sky-700'}`}>{item.name}</h3>
                          {actualExpiryDate && (
                              <span className={`text-xs font-medium ${expiryStatus ? expiryStatus.color : (currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`}>
                                  {item.manualExpiryDate ? <History size={12} className="inline mr-0.5" title={t('manualExpiryDateInfo')} /> : null}
                                  {t('actualExpiryDateDisplay')}: {actualExpiryDate.toLocaleDateString(currentLanguage.startsWith('ja') ? 'ja-JP' : 'zh-TW')}
                              </span>
                          )}
                      </div>
                      <span className={`text-xs mb-2 block ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <CalendarDays size={12} className="inline mr-1" /> {t('purchaseDateDisplay')}: {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString(currentLanguage.startsWith('ja') ? 'ja-JP' : 'zh-TW') : 'N/A'}
                      </span>
                      
                      <p className={`text-sm mb-1 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}><Package size={14} className={`inline mr-1 ${currentTheme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`} />{t('quantityDisplay')}: {item.quantity}</p>
                      
                      {expiryStatus && ( <p className={`text-sm font-medium my-1 flex items-center ${expiryStatus.color}`}> {expiryStatus.icon} {expiryStatus.text} </p> )}
                      {item.storageLocation && ( <p className={`text-xs px-2 py-0.5 rounded-md inline-block my-1 ${currentTheme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}> <Thermometer size={12} className="inline mr-1" /> {t('storageLocationDisplay')}: {item.storageLocation} </p> )}
                      <br />
                      {item.shelfLifeDays != null && !item.manualExpiryDate && ( <p className={`text-xs px-2 py-0.5 rounded-md inline-block my-1 ${currentTheme === 'dark' ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-600'}`}> <Clock size={12} className="inline mr-1" /> {t('shelfLifeDaysDisplay')}: {item.shelfLifeDays} {t('daysUnit')} </p> )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-sky-200 dark:border-slate-600">
                      <button onClick={() => getAIStorageAdvice(item)} disabled={isLoadingAI}
                        className={`text-xs font-medium py-1.5 px-2.5 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out flex items-center disabled:opacity-60 
                        ${currentTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}
                      `}>
                        {isLoadingAI ? ( <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : ( <Brain size={14} className="mr-1" /> )}
                        {t('aiStorageButton')}
                      </button>
                      <button onClick={() => getAIRecipes({ append: false, directTargetItemName: item.name, directCustomSettings: customRecipeUserPrefs })} 
                        disabled={isLoadingRecipes}
                        className={`text-xs font-medium py-1.5 px-2.5 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out flex items-center disabled:opacity-60 
                        ${currentTheme === 'dark' ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}
                      `}>
                        {isLoadingRecipes && recipes.length === 0 ? ( <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ) : ( <Utensils size={14} className="mr-1" /> )}
                        {t('recipesWithThisItemButton')}
                      </button>
                      <button onClick={() => startEditItem(item)}
                        className={`text-xs font-medium py-1.5 px-2.5 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out flex items-center 
                        ${currentTheme === 'dark' ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}
                      `}>
                        <Edit3 size={14} className="mr-1"/> {t('editButton')}
                      </button>
                      {fridgeItemIdPendingDelete === item.id ? (
                          <div className="flex gap-1">
                              <button onClick={() => { handleDeleteItem(item.id); setFridgeItemIdPendingDelete(null); }}
                                  className={`text-xs font-medium py-1.5 px-2 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out flex items-center 
                                  ${currentTheme === 'dark' ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                                  <Check size={14} className="mr-1"/> {t('confirmDeleteButton')}
                              </button>
                              <button onClick={() => setFridgeItemIdPendingDelete(null)}
                                  className={`text-xs font-medium py-1.5 px-2 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out flex items-center 
                                  ${currentTheme === 'dark' ? 'bg-slate-600 hover:bg-slate-500 text-white' : 'bg-gray-400 hover:bg-gray-500 text-white'}`}>
                                  <X size={14} className="mr-1"/> {t('cancelButton')}
                              </button>
                          </div>
                      ) : (
                          <button onClick={() => setFridgeItemIdPendingDelete(item.id)}
                          className={`text-xs font-medium py-1.5 px-2.5 rounded-lg shadow hover:shadow-md transition duration-150 ease-in-out flex items-center 
                          ${currentTheme === 'dark' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}
                          `}>
                          <Trash2 size={14} className="mr-1"/> {t('deleteButton')}
                          </button>
                      )}
                    </div>
                  </>
              </div>
              );
            })}
          </div>
        </div>
        <footer className={`text-center mt-12 text-sm ${currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
          <p>&copy; {new Date().getFullYear()} {t('appName')}. {t('footerText')}</p>
          <p className="mt-1">
            <a href="https://github.com/google/generative-ai-docs/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className={`transition-colors flex items-center justify-center ${currentTheme === 'dark' ? 'hover:text-sky-400' : 'hover:text-sky-600'}`}>
              <ExternalLink size={14} className="mr-1"/> {t('geminiApiLinkText')}
            </a>
          </p>
        </footer>
      </div>
    </div>
    </>
  );
};

export default App;

