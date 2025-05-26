import '../scss/index.scss';
import tomatoLogo from '../img/svg/noto_tomato.svg';
import binIcon from '../img/svg/bin.svg';
import popupIcon from '../img/svg/popup.svg';
import penIcon from '../img/svg/pen.svg';
import closeIcon from '../img/svg/close-btn.svg';
import burgerIcon from '../img/svg/burger-button.svg';

// Импортируем шрифты
import '../fonts/nunito-v26-cyrillic_latin-regular.woff2';

console.log("Webpack работает!");

// Настройки таймера
const WORK_TIME = 25 * 60; 
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60; 
const POMODORO_CYCLES = 4;

// Класс задачи
class Task {
  constructor(name, importance = 'default', id = Date.now().toString()) {
    this.id = id;
    this.name = name;
    this.importance = importance;
    this.completed = false;
    this.createdAt = new Date();
  }
}

// Модель данных приложения
const TasksModel = {
  tasks: [],
  activeTaskId: null,
  
  // Загрузка задач из localStorage
  loadTasks() {
    const savedTasks = localStorage.getItem('pomodoro_tasks');
    const activeTask = localStorage.getItem('pomodoro_active_task');
    
    if (savedTasks) {
      this.tasks = JSON.parse(savedTasks);
    }
    
    if (activeTask) {
      this.activeTaskId = activeTask;
    }
  },
  
  // Сохранение задач в localStorage
  saveTasks() {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(this.tasks));
    if (this.activeTaskId) {
      localStorage.setItem('pomodoro_active_task', this.activeTaskId);
    }
  },
  
  // Добавление задачи
  addTask(name, importance) {
    const task = new Task(name, importance);
    this.tasks.push(task);
    this.saveTasks();
    return task;
  },
  
  // Удаление задачи
  deleteTask(id) {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      
      // Если удаляем активную задачу, сбрасываем активную задачу
      if (this.activeTaskId === id) {
        this.activeTaskId = null;
        localStorage.removeItem('pomodoro_active_task');
      }
      
      this.saveTasks();
      return true;
    }
    return false;
  },
  
  // Обновление задачи
  updateTask(id, name, importance) {
    console.log('Вызов updateTask с параметрами:', id, name, importance);
    
    // Проверка на корректность параметров
    if (!id || typeof id !== 'string') {
      console.error('Ошибка updateTask: некорректный ID задачи', id);
      return false;
    }
    
    if (!name || typeof name !== 'string') {
      console.error('Ошибка updateTask: некорректное имя задачи', name);
      return false;
    }
    
    if (!importanceClasses.includes(importance)) {
      console.error('Ошибка updateTask: некорректная важность задачи', importance);
      importance = 'default'; // Устанавливаем значение по умолчанию
    }
    
    const task = this.tasks.find(task => task.id === id);
    if (task) {
      console.log('Найдена задача для обновления:', task);
      task.name = name;
      task.importance = importance;
      this.saveTasks();
      console.log('Задача успешно обновлена');
      return true;
    }
    console.log('Задача для обновления не найдена!');
    return false;
  },
  
  // Установка активной задачи
  setActiveTask(id) {
    this.activeTaskId = id;
    localStorage.setItem('pomodoro_active_task', id);
    this.saveTasks();
  },
  
  // Получение активной задачи
  getActiveTask() {
    if (!this.activeTaskId) return null;
    return this.tasks.find(task => task.id === this.activeTaskId);
  }
};

// Переменные состояния
let timer;
let timerRunning = false;
let currentTime = WORK_TIME;
let cycleCount = 0;
let isWorkTime = true;

// Переключение важности задачи
let importanceCount = 0;
const importanceClasses = ['default', 'important', 'so-so'];

// Вспомогательные функции

// Обновляем оценку времени выполнения всех задач
function updateDeadlineTime() {
  console.log('Обновление времени выполнения задач');
  const deadlineElement = document.querySelector('.tasks__deadline');
  
  if (!deadlineElement) {
    console.error('Не найден элемент времени выполнения (.tasks__deadline)');
    return;
  }
  
  // Расчет общего времени (1 помидор = 25 минут)
  const totalMinutes = TasksModel.tasks.length * 25;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  // Форматирование строки времени
  let timeString = '';
  if (hours > 0) {
    timeString += `${hours}\u00A0час`;
    if (hours > 1 && hours < 5) timeString += 'а';
    else if (hours >= 5) timeString += 'ов';
    
    if (minutes > 0) timeString += ' ';
  }
  
  if (minutes > 0) {
    timeString += `${minutes}\u00A0мин`;
  }
  
  // Если нет задач, показываем 0 мин
  if (!timeString) {
    timeString = '0\u00A0мин';
  }
  
  deadlineElement.textContent = timeString;
  console.log('Установлено время выполнения:', timeString);
}

// Сброс кнопки важности к стандартному значению
function resetImportanceButton(button) {
  console.log('Сброс кнопки важности');
  importanceClasses.forEach(cls => button.classList.remove(cls));
  button.classList.add('default');
  importanceCount = 0;
}

// Инициализируем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM полностью загружен');
  
  // Устанавливаем изображение логотипа
  const logoImg = document.querySelector('.header__logo');
  if (logoImg) {
    logoImg.src = tomatoLogo;
    console.log('Логотип установлен');
  }

  // Используем стили для кнопок с иконками напрямую
  const style = document.createElement('style');
  style.textContent = `
    .tasks__button { 
      background-image: url(${burgerIcon}) !important; 
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: contain !important;
    }
    .popup__edit-button::before { 
      content: "" !important;
      position: absolute !important;
      left: 13px !important;
      top: 10px !important;
      width: 15px !important;
      height: 15px !important;
      background-image: url(${penIcon}) !important; 
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: contain !important;
    }
    .popup__delete-button::before { 
      content: "" !important;
      position: absolute !important;
      left: 13px !important;
      top: 10px !important;
      width: 15px !important;
      height: 15px !important;
      background-image: url(${binIcon}) !important; 
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: contain !important;
    }
    .modal-delete__close-button { 
      background-image: url(${closeIcon}) !important; 
      background-repeat: no-repeat !important;
      background-position: center !important;
      background-size: contain !important;
    }
  `;
  document.head.appendChild(style);
  console.log('Стили добавлены');

  // Инициализируем кнопку важности
  const importanceButton = document.querySelector('.button-importance');
  if (importanceButton) {
    importanceButton.addEventListener('click', ({target}) => {
      importanceCount = (importanceCount + 1) % importanceClasses.length;
      
      // Удаляем все классы важности
      importanceClasses.forEach(cls => {
        target.classList.remove(cls);
      });
      
      // Добавляем новый класс важности
      target.classList.add(importanceClasses[importanceCount]);
      
      console.log('Важность изменена на', importanceClasses[importanceCount]);
    });
    console.log('Кнопка важности инициализирована');
  }

  // Загружаем задачи из localStorage
  TasksModel.loadTasks();
  console.log('Задачи загружены:', TasksModel.tasks.length);
  
  // Инициализируем интерфейс
  initTasksInterface();
  initializeTimer();
  initModalHandlers();
  initTaskForm();
  
  console.log('Инициализация завершена');
});

// Функция добавления задачи в интерфейс
function addTaskToList(task, number) {
  console.log('Добавление задачи в список:', task.name);
  const tasksList = document.querySelector('.tasks__list');
  
  if (!tasksList) {
    console.error('Не найден элемент списка задач (.tasks__list)');
    return;
  }
  
  const taskItem = document.createElement('li');
  taskItem.className = `tasks__item ${task.importance}`;
  
  // Номер задачи
  const numberSpan = document.createElement('span');
  numberSpan.className = 'count-number';
  numberSpan.textContent = number || TasksModel.tasks.length;
  
  // Текст задачи
  const taskButton = document.createElement('button');
  taskButton.className = 'tasks__text';
  taskButton.textContent = task.name;
  taskButton.dataset.taskId = task.id;
  
  // Кнопка настроек
  const settingsButton = document.createElement('button');
  settingsButton.className = 'tasks__button';
  
  // Контейнер для выпадающего меню
  const popup = document.createElement('div');
  popup.className = 'popup';
  
  // Кнопки действий в меню
  const editButton = document.createElement('button');
  editButton.className = 'popup__button popup__edit-button';
  editButton.textContent = 'Редактировать';
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'popup__button popup__delete-button';
  deleteButton.textContent = 'Удалить';
  
  // Добавляем кнопки в меню
  popup.appendChild(editButton);
  popup.appendChild(deleteButton);
  
  // Обработчик клика на настройки
  settingsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('Нажата кнопка настроек для задачи:', task.name);
    
    // Закрываем все открытые попапы перед открытием нового
    document.querySelectorAll('.popup_active').forEach(p => {
      if (p !== popup) p.classList.remove('popup_active');
    });
    
    // Переключаем состояние текущего попапа
    popup.classList.toggle('popup_active');
  });
  
  // Обработчик клика на редактирование
  editButton.addEventListener('click', () => {
    console.log('Редактирование задачи:', task.name, 'с ID:', task.id);
    // Получаем текущую задачу
    const currentTask = TasksModel.tasks.find(t => t.id === task.id);
    if (currentTask) {
      console.log('Найдена задача для редактирования в модели:', currentTask);
      const taskNameInput = document.querySelector('#task-name');
      const importanceButton = document.querySelector('.button-importance');
      const taskForm = document.querySelector('.task-form');
      
      if (!taskNameInput || !importanceButton || !taskForm) {
        console.error('Не найдены элементы формы');
        return;
      }
      
      // Заполняем форму данными для редактирования
      taskNameInput.value = currentTask.name;
      resetImportanceButton(importanceButton);
      
      // Устанавливаем правильный приоритет в кнопке выбора важности
      importanceButton.classList.add(currentTask.importance);
      
      // Устанавливаем счетчик важности на правильное значение
      importanceCount = importanceClasses.indexOf(currentTask.importance);
      
      // Переключаем форму в режим редактирования
      taskForm.dataset.editMode = 'true';
      taskForm.dataset.taskId = task.id;
      console.log('Установлен ID задачи для редактирования:', taskForm.dataset.taskId);
      
      // Меняем текст кнопки
      const submitButton = taskForm.querySelector('.task-form__add-button');
      if (submitButton) {
        submitButton.textContent = 'Сохранить';
      }
      
      // Добавляем класс редактирования форме
      taskForm.classList.add('edit-mode');
      
      // Отображаем сообщение о редактировании
      const taskFormTitle = document.createElement('div');
      taskFormTitle.className = 'task-form__edit-indicator';
      taskFormTitle.textContent = 'Режим редактирования';
      
      // Удаляем предыдущий индикатор, если он есть
      const existingIndicator = taskForm.querySelector('.task-form__edit-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      // Добавляем индикатор в начало формы
      taskForm.prepend(taskFormTitle);
      
      // Добавляем кнопку отмены, если её ещё нет
      let cancelButton = taskForm.querySelector('.task-form__cancel-button');
      if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'button button-secondary task-form__cancel-button';
        cancelButton.textContent = 'Отмена';
        
        // Добавляем обработчик клика для отмены редактирования
        cancelButton.addEventListener('click', () => {
          resetEditMode(taskForm, importanceButton);
        });
        
        // Вставляем кнопку отмены перед кнопкой добавления
        const addButton = taskForm.querySelector('.task-form__add-button');
        if (addButton && addButton.parentNode) {
          addButton.parentNode.insertBefore(cancelButton, addButton);
        } else {
          taskForm.appendChild(cancelButton);
        }
      }
      
      // Фокус на инпут
      taskNameInput.focus();
    }
    
    // Закрываем попап
    popup.classList.remove('popup_active');
  });
  
  // Обработчик клика на удаление
  deleteButton.addEventListener('click', () => {
    console.log('Запрос на удаление задачи:', task.name);
    showDeleteConfirmation(task.id);
    popup.classList.remove('popup_active');
  });
  
  // Обработчик клика на задачу (выбор активной задачи)
  taskButton.addEventListener('click', () => {
    console.log('Выбрана задача:', task.name);
    // Убираем активное состояние у всех задач
    document.querySelectorAll('.tasks__text').forEach(btn => {
      btn.classList.remove('tasks__text_active');
    });
    
    // Устанавливаем активное состояние выбранной задаче
    taskButton.classList.add('tasks__text_active');
    
    // Устанавливаем активную задачу в модели
    TasksModel.setActiveTask(task.id);
    
    // Обновляем заголовок в таймере
    const titleElement = document.querySelector('.window__panel-title');
    if (titleElement) {
      titleElement.textContent = task.name;
    }
  });
  
  // Добавляем все элементы в задачу
  taskItem.appendChild(numberSpan);
  taskItem.appendChild(taskButton);
  taskItem.appendChild(settingsButton);
  taskItem.appendChild(popup);
  
  // Добавляем задачу в список
  tasksList.appendChild(taskItem);
}

// Функция отображения всех задач
function renderTasks() {
  console.log('Рендеринг задач');
  const tasksList = document.querySelector('.tasks__list');
  
  if (!tasksList) {
    console.error('Не найден элемент списка задач (.tasks__list)');
    return;
  }
  
  // Очищаем список
  tasksList.innerHTML = '';
  
  // Добавляем задачи
  TasksModel.tasks.forEach((task, index) => {
    addTaskToList(task, index + 1);
  });
  
  // Восстанавливаем активную задачу, если есть
  const activeTask = TasksModel.getActiveTask();
  if (activeTask) {
    const taskElement = document.querySelector(`[data-task-id="${activeTask.id}"]`);
    if (taskElement) {
      taskElement.classList.add('tasks__text_active');
      const titleElement = document.querySelector('.window__panel-title');
      if (titleElement) {
        titleElement.textContent = activeTask.name;
      }
    }
  }
  
  // Обновляем время выполнения
  updateDeadlineTime();
  
  console.log('Задачи отрендерены');
}

// Функция инициализации интерфейса задач
function initTasksInterface() {
  const tasksList = document.querySelector('.tasks__list');
  const taskForm = document.querySelector('.task-form');
  const taskNameInput = document.querySelector('#task-name');
  const importanceButton = document.querySelector('.button-importance');
  
  // Отображаем сохраненные задачи
  renderTasks();
  
  // Обработчик формы добавления задачи был перемещен в функцию initTaskForm
  // для избежания дублирования и конфликтов при редактировании задач
}

// Глобальная функция для показа модального окна удаления
window.showDeleteConfirmation = function(taskId) {
  console.log('Открытие модального окна удаления для задачи:', taskId);
  const modalOverlay = document.querySelector('.modal-overlay');
  if (modalOverlay) {
    // Устанавливаем ID задачи в атрибут данных
    modalOverlay.dataset.taskToDeleteId = taskId;
    modalOverlay.style.display = 'block';
  } else {
    console.error('Не найден элемент overlay для модального окна');
  }
};

// Функция инициализации модальных окон
function initModalHandlers() {
  console.log('Инициализация модальных окон');
  const modalOverlay = document.querySelector('.modal-overlay');
  const closeButton = document.querySelector('.modal-delete__close-button');
  const cancelButton = document.querySelector('.modal-delete__cancel-button');
  const deleteButton = document.querySelector('.modal-delete__delete-button');
  
  if (!modalOverlay || !closeButton || !cancelButton || !deleteButton) {
    console.error('Не найдены элементы модального окна');
    return;
  }
  
  // Обработчики закрытия модального окна
  [closeButton, cancelButton].forEach(button => {
    button.addEventListener('click', () => {
      console.log('Закрытие модального окна');
      modalOverlay.style.display = 'none';
    });
  });
  
  // Обработчик подтверждения удаления
  deleteButton.addEventListener('click', () => {
    const taskToDeleteId = modalOverlay.dataset.taskToDeleteId;
    if (taskToDeleteId) {
      console.log('Подтверждено удаление задачи:', taskToDeleteId);
      // Удаляем задачу из модели
      TasksModel.deleteTask(taskToDeleteId);
      
      // Перерендериваем список задач
      renderTasks();
      
      // Закрываем модальное окно
      modalOverlay.style.display = 'none';
      
      // Сбрасываем ID удаляемой задачи
      delete modalOverlay.dataset.taskToDeleteId;
    }
  });
  
  // Закрытие при клике на оверлей
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      console.log('Закрытие модального окна по клику на оверлей');
      modalOverlay.style.display = 'none';
    }
  });
  
  console.log('Модальные окна инициализированы');
}

// Функция инициализации таймера
function initializeTimer() {
  console.log('Инициализация таймера');
  
  // DOM элементы
  const timerText = document.querySelector('.window__timer-text');
  const startButton = document.querySelector('.button-primary');
  const stopButton = document.querySelector('.button-secondary');
  const taskText = document.querySelector('.window__panel-title');
  const cycleText = document.querySelector('.window__panel-task-text');
  
  if (!timerText || !startButton || !stopButton || !taskText || !cycleText) {
    console.error('Не найдены элементы таймера');
    return;
  }
  
  // Обновление отображаемого времени
  updateTimerDisplay();
  
  // Обработчик нажатия на кнопку "Старт"
  startButton.addEventListener('click', () => {
    console.log('Нажата кнопка "Старт"');
    if (!timerRunning) {
      timer = setInterval(updateTimer, 1000);
      timerRunning = true;
      toggleButtons();
      console.log('Таймер запущен');
    }
  });
  
  // Обработчик нажатия на кнопку "Стоп"
  stopButton.addEventListener('click', () => {
    console.log('Нажата кнопка "Стоп"');
    if (timerRunning) {
      clearInterval(timer);
      timerRunning = false;
      toggleButtons();
      console.log('Таймер остановлен');
    }
  });
  
  // Функция форматирования времени (минуты:секунды)
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }
  
  // Обновление отображаемого времени
  function updateTimerDisplay() {
    timerText.textContent = formatTime(currentTime);
  }
  
  // Функция обновления таймера
  function updateTimer() {
    if (currentTime > 0) {
      currentTime--;
      updateTimerDisplay();
    } else {
      completeTimer();
    }
  }
  
  // Функция завершения таймера
  function completeTimer() {
    console.log('Таймер завершен');
    clearInterval(timer);
    timerRunning = false;
    
    // Звуковое уведомление (можно добавить позже)
    console.log('Воспроизведение звука уведомления');
    
    try {
      // Показываем уведомление
      alert('Время истекло!');
      
      if (isWorkTime) {
        cycleCount++;
        console.log('Завершен рабочий период, текущий цикл:', cycleCount);
        
        // Проверяем нужен ли длинный перерыв
        if (cycleCount % POMODORO_CYCLES === 0) {
          currentTime = LONG_BREAK;
          cycleText.textContent = 'Длинный перерыв';
          console.log('Начат длинный перерыв');
        } else {
          currentTime = SHORT_BREAK;
          cycleText.textContent = 'Короткий перерыв';
          console.log('Начат короткий перерыв');
        }
        isWorkTime = false;
      } else {
        currentTime = WORK_TIME;
        cycleText.textContent = `Томат ${Math.floor(cycleCount / POMODORO_CYCLES) + 1}`;
        isWorkTime = true;
        console.log('Начат рабочий период');
      }
      
      updateTimerDisplay();
      toggleButtons();
    } catch (error) {
      console.error('Ошибка при завершении таймера:', error);
    }
  }
  
  // Переключение кнопок старт/стоп
  function toggleButtons() {
    console.log('Переключение кнопок таймера');
    startButton.classList.toggle('hidden');
    stopButton.classList.toggle('hidden');
  }
  
  console.log('Таймер инициализирован');
}

// Инициализация формы добавления задач
function initTaskForm() {
  console.log('Инициализация формы добавления задач');
  const taskForm = document.querySelector('.task-form');
  const taskNameInput = document.querySelector('#task-name');
  const importanceButton = document.querySelector('.button-importance');
  
  if (!taskForm || !taskNameInput || !importanceButton) {
    console.error('Не найдены элементы формы добавления задач');
    return;
  }
  
  // Обработчик формы добавления задачи
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Отправка формы задачи');
    
    const taskName = taskNameInput.value.trim();
    if (taskName) {
      // Получаем текущую важность из кнопки
      let importance = 'default';
      for (let i = 0; i < importanceClasses.length; i++) {
        if (importanceButton.classList.contains(importanceClasses[i])) {
          importance = importanceClasses[i];
          break;
        }
      }
      
      console.log('Режим редактирования:', taskForm.dataset.editMode, 'ID задачи:', taskForm.dataset.taskId);
      
      // Проверяем, редактируем или создаем новую задачу
      if (taskForm.dataset.editMode === 'true' && taskForm.dataset.taskId) {
        const taskId = taskForm.dataset.taskId;
        console.log('Обновление задачи:', taskId);
        
        // Проверяем, существует ли задача с указанным ID
        const taskToUpdate = TasksModel.tasks.find(t => t.id === taskId);
        if (taskToUpdate) {
          console.log('Найдена задача для обновления:', taskToUpdate);
          
          // Обновляем существующую задачу
          const result = TasksModel.updateTask(taskId, taskName, importance);
          console.log('Результат обновления задачи:', result);
          
          // Сбрасываем режим редактирования
          resetEditMode(taskForm, importanceButton);
          
          // Обновляем отображение задач
          renderTasks();
          
          // Обновляем время выполнения
          updateDeadlineTime();
        } else {
          console.error('Не найдена задача с ID:', taskId);
          alert('Произошла ошибка при обновлении задачи. Попробуйте снова.');
          
          // Сбрасываем режим редактирования
          resetEditMode(taskForm, importanceButton);
          
          // Обновляем отображение задач
          renderTasks();
        }
      } else {
        console.log('Создание новой задачи:', taskName);
        // Создаем новую задачу
        TasksModel.addTask(taskName, importance);
        
        // Очищаем форму
        taskNameInput.value = '';
        
        // Сбрасываем важность на стандартную
        resetImportanceButton(importanceButton);
        
        // Обновляем отображение задач
        renderTasks();
      }
    }
  });
  
  console.log('Форма добавления задач инициализирована');
}

// Функция сброса режима редактирования
function resetEditMode(taskForm, importanceButton) {
  console.log('Сброс режима редактирования');
  
  // Сбрасываем режим редактирования
  taskForm.dataset.editMode = 'false';
  delete taskForm.dataset.taskId;
  
  // Удаляем класс редактирования с формы
  taskForm.classList.remove('edit-mode');
  
  // Удаляем индикатор редактирования
  const existingIndicator = taskForm.querySelector('.task-form__edit-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Возвращаем текст кнопки
  const submitButton = taskForm.querySelector('.task-form__add-button');
  if (submitButton) {
    submitButton.textContent = 'Добавить';
  }
  
  // Сбрасываем важность
  resetImportanceButton(importanceButton);
  
  // Очищаем поле ввода
  const taskNameInput = taskForm.querySelector('#task-name');
  if (taskNameInput) {
    taskNameInput.value = '';
  }
  
  // Удаляем кнопку отмены, если она есть
  const cancelButton = taskForm.querySelector('.task-form__cancel-button');
  if (cancelButton) {
    cancelButton.remove();
  }
}
