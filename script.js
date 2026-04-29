'use strict';

// ============================================
// STORAGE MODULE
// ============================================
const Storage = {
    KEYS: {
        USERS: 'boxing_users',
        CURRENT_USER: 'boxing_current_user',
        ATHLETES: 'boxing_athletes'
    },

    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage read error:', error);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage write error:', error);
            return false;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    getUsers() {
        return this.get(this.KEYS.USERS) || [];
    },

    setUsers(users) {
        return this.set(this.KEYS.USERS, users);
    },

    getCurrentUser() {
        const userId = this.get(this.KEYS.CURRENT_USER);
        if (!userId) return null;
        const users = this.getUsers();
        return users.find(u => u.id === userId) || null;
    },

    setCurrentUser(userId) {
        return this.set(this.KEYS.CURRENT_USER, userId);
    },

    logout() {
        this.remove(this.KEYS.CURRENT_USER);
    },

    getAthletes() {
        return this.get(this.KEYS.ATHLETES) || [];
    },

    setAthletes(athletes) {
        return this.set(this.KEYS.ATHLETES, athletes);
    },

    getCoachAthletes() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return [];
        const athletes = this.getAthletes();
        return athletes.filter(a => a.coachId === currentUser.id);
    },

    getAthleteById(id) {
        const athletes = this.getAthletes();
        return athletes.find(a => a.id === id) || null;
    },

    getAthleteByToken(token) {
        const athletes = this.getAthletes();
        return athletes.find(a => a.shareToken === token) || null;
    },

    addAthlete(athlete) {
        const athletes = this.getAthletes();
        athletes.push(athlete);
        return this.setAthletes(athletes);
    },

    updateAthlete(id, updates) {
        const athletes = this.getAthletes();
        const index = athletes.findIndex(a => a.id === id);
        if (index === -1) return false;
        athletes[index] = { ...athletes[index], ...updates };
        return this.setAthletes(athletes);
    },

    deleteAthlete(id) {
        const athletes = this.getAthletes();
        const filtered = athletes.filter(a => a.id !== id);
        return this.setAthletes(filtered);
    }
};

// Инициализация хранилища
if (!Storage.get(Storage.KEYS.USERS)) {
    Storage.setUsers([]);
}
if (!Storage.get(Storage.KEYS.ATHLETES)) {
    Storage.setAthletes([]);
}

// ============================================
// UTILITIES MODULE
// ============================================
const Utils = {
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    },

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('ru-RU', options);
    },

    getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    getHashParams() {
        const hash = window.location.hash.substring(1);
        const parts = hash.split('?');
        const page = parts[0] || '';
        const params = {};
        
        if (parts[1]) {
            parts[1].split('&').forEach(param => {
                const [key, value] = param.split('=');
                params[key] = decodeURIComponent(value);
            });
        }
        
        return { page, params };
    },

    // Вычисление возраста из года рождения
    calculateAge(birthYear) {
        return new Date().getFullYear() - birthYear;
    }
};

// ============================================
// SKILLS DATA
// ============================================
const SKILLS_DATA = {
    technique: {
        name: "Техника ударов",
        skills: [
            { id: "jab", name: "Джеб (прямой передней рукой)" },
            { id: "cross", name: "Кросс (прямой задней рукой)" },
            { id: "hook", name: "Хук (боковой удар)" },
            { id: "uppercut", name: "Апперкот" },
            { id: "body-punch", name: "Удары по корпусу" },
            { id: "combination", name: "Комбинации ударов" }
        ]
    },
    defense: {
        name: "Защита",
        skills: [
            { id: "block", name: "Блокирование" },
            { id: "parry", name: "Отбивы" },
            { id: "slip", name: "Уклоны" },
            { id: "duck", name: "Нырки" },
            { id: "footwork-defense", name: "Работа ног в защите" }
        ]
    },
    physical: {
        name: "Физические качества",
        skills: [
            { id: "speed", name: "Скорость" },
            { id: "endurance", name: "Выносливость" },
            { id: "strength", name: "Сила удара" },
            { id: "reaction", name: "Реакция" },
            { id: "coordination", name: "Координация" },
            { id: "flexibility", name: "Гибкость" }
        ]
    },
    tactics: {
        name: "Тактика и психология",
        skills: [
            { id: "ring-control", name: "Контроль ринга" },
            { id: "distance", name: "Работа на дистанции" },
            { id: "timing", name: "Чувство времени (тайминг)" },
            { id: "pressure", name: "Давление на противника" },
            { id: "mental", name: "Психологическая устойчивость" },
            { id: "adaptation", name: "Адаптация к сопернику" }
        ]
    },
    footwork: {
        name: "Работа ног",
        skills: [
            { id: "movement", name: "Передвижение по рингу" },
            { id: "pivots", name: "Развороты" },
            { id: "stance", name: "Стойка" },
            { id: "balance", name: "Баланс" }
        ]
    }
};

function getAllSkills() {
    const allSkills = [];
    Object.keys(SKILLS_DATA).forEach(categoryId => {
        const category = SKILLS_DATA[categoryId];
        category.skills.forEach(skill => {
            allSkills.push({
                categoryId,
                categoryName: category.name,
                ...skill
            });
        });
    });
    return allSkills;
}

function getSkillById(skillId) {
    const allSkills = getAllSkills();
    return allSkills.find(s => s.id === skillId);
}

// ============================================
// CALCULATIONS MODULE
// ============================================
const Calculations = {
    calculatePotential(athlete) {
        if (!athlete.anthropometry || athlete.anthropometry.length === 0) return 0;
        const latest = athlete.anthropometry[athlete.anthropometry.length - 1];
        const { height, weight, reach } = latest;
        const age = Utils.calculateAge(athlete.birthYear); // Используем birthYear
        const gender = athlete.gender;
        let score = 0;

        // Reach ratio
        const reachRatio = reach / height;
        if (reachRatio >= 1.05 && reachRatio <= 1.10) score += 30;
        else if (reachRatio >= 1.0 && reachRatio < 1.05) score += 25;
        else if (reachRatio > 1.10 && reachRatio <= 1.15) score += 25;
        else score += 15;

        // BMI
        const bmi = weight / ((height/100) * (height/100));
        if (gender === 'M') {
            if (bmi >= 22 && bmi <= 25) score += 25;
            else if (bmi >= 20 && bmi < 22) score += 20;
            else if (bmi > 25 && bmi <= 27) score += 20;
            else score += 10;
        } else {
            if (bmi >= 21 && bmi <= 24) score += 25;
            else if (bmi >= 19 && bmi < 21) score += 20;
            else if (bmi > 24 && bmi <= 26) score += 20;
            else score += 10;
        }

        // Age factor
        if (age >= 10 && age <= 14) score += 20;
        else if (age >= 15 && age <= 17) score += 25;
        else if (age >= 18 && age <= 25) score += 20;
        else if (age >= 26 && age <= 30) score += 15;
        else score += 10;

        // Height factor
        if (gender === 'M') {
            if (height >= 170 && height <= 185) score += 20;
            else if (height >= 160 && height < 170) score += 15;
            else if (height > 185 && height <= 195) score += 15;
            else score += 10;
        } else {
            if (height >= 160 && height <= 175) score += 20;
            else if (height >= 150 && height < 160) score += 15;
            else if (height > 175 && height <= 180) score += 15;
            else score += 10;
        }

        return Math.min(100, Math.round(score));
    },

    calculateRealization(athlete) {
        if (!athlete.skills) return 0;
        const allRatings = [];
        Object.keys(athlete.skills).forEach(categoryId => {
            const categorySkills = athlete.skills[categoryId];
            Object.values(categorySkills).forEach(rating => {
                if (typeof rating === 'number') allRatings.push(rating);
            });
        });
        if (allRatings.length === 0) return 0;
        const average = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;
        return Math.round((average / 10) * 100);
    },

    calculateGap(potential, realization) {
        return potential - realization;
    },

    updateAthleteMetrics(athleteId) {
        const athlete = Storage.getAthleteById(athleteId);
        if (!athlete) return null;
        const potential = this.calculatePotential(athlete);
        const realization = this.calculateRealization(athlete);
        const gap = this.calculateGap(potential, realization);
        const metrics = { potential, realization, gap };
        Storage.updateAthlete(athleteId, { metrics });
        return metrics;
    },

    getStrengths(athlete) {
        if (!athlete.skills) return [];
        const allSkills = [];
        Object.keys(athlete.skills).forEach(categoryId => {
            const categorySkills = athlete.skills[categoryId];
            Object.keys(categorySkills).forEach(skillId => {
                const rating = categorySkills[skillId];
                const skillData = getSkillById(skillId);
                if (skillData && rating >= 7) {
                    allSkills.push({ ...skillData, rating });
                }
            });
        });
        allSkills.sort((a, b) => b.rating - a.rating);
        return allSkills.slice(0, 5);
    },

    getWeaknesses(athlete) {
        if (!athlete.skills) return [];
        const weakSkills = [];
        Object.keys(athlete.skills).forEach(categoryId => {
            const categorySkills = athlete.skills[categoryId];
            Object.keys(categorySkills).forEach(skillId => {
                const rating = categorySkills[skillId];
                const skillData = getSkillById(skillId);
                if (skillData && rating <= 5) {
                    weakSkills.push({ ...skillData, rating });
                }
            });
        });
        weakSkills.sort((a, b) => a.rating - b.rating);
        return weakSkills.slice(0, 5);
    }
};

// ============================================
// NORMS MODULE
// ============================================
const Norms = {
    potentialByAge: {
        '10-14': { min: 60, avg: 75, max: 90 },
        '15-17': { min: 65, avg: 80, max: 95 },
        '18-25': { min: 70, avg: 85, max: 100 },
        '26-30': { min: 65, avg: 80, max: 95 },
        '31+': { min: 60, avg: 75, max: 90 }
    },
    realizationByAge: {
        '10-14': { min: 40, avg: 55, max: 70 },
        '15-17': { min: 50, avg: 65, max: 80 },
        '18-25': { min: 60, avg: 75, max: 90 },
        '26-30': { min: 65, avg: 80, max: 95 },
        '31+': { min: 60, avg: 75, max: 90 }
    },
    getAgeCategory(age) {
        if (age >= 10 && age <= 14) return '10-14';
        if (age >= 15 && age <= 17) return '15-17';
        if (age >= 18 && age <= 25) return '18-25';
        if (age >= 26 && age <= 30) return '26-30';
        return '31+';
    },
    getNorms(athlete) {
        const age = Utils.calculateAge(athlete.birthYear);
        const ageCategory = this.getAgeCategory(age);
        return {
            birthYear: athlete.birthYear,
            age: age,
            ageCategory,
            gender: athlete.gender === 'M' ? 'Мужской' : 'Женский',
            potential: this.potentialByAge[ageCategory],
            realization: this.realizationByAge[ageCategory]
        };
    }
};

// ============================================
// RECOMMENDATIONS MODULE
// ============================================
const Recommendations = {
    generate(athlete) {
        const recommendations = [];
        const metrics = athlete.metrics || {};
        const gap = metrics.gap || 0;

        if (gap > 20) {
            recommendations.push({
                type: 'critical',
                title: 'Большой разрыв между потенциалом и реализацией',
                text: `Разрыв составляет ${gap} баллов. Необходимо усилить практическую работу над навыками.`
            });
        } else if (gap > 10) {
            recommendations.push({
                type: 'warning',
                title: 'Есть резервы для роста',
                text: `Разрыв ${gap} баллов указывает на нереализованный потенциал.`
            });
        } else if (gap < 5) {
            recommendations.push({
                type: 'success',
                title: 'Отличная реализация потенциала',
                text: 'Спортсмен работает на пределе возможностей.'
            });
        }

        const weaknesses = Calculations.getWeaknesses(athlete);
        if (weaknesses.length > 0) {
            const topWeakness = weaknesses[0];
            recommendations.push({
                type: 'warning',
                title: `Критическая зона: ${topWeakness.name}`,
                text: `Оценка ${topWeakness.rating}/10. Требуется больше практики.`
            });
        }

        return recommendations;
    }
};

// ============================================
// AUTH MODULE
// ============================================
const Auth = {
    register(email, password, firstName, lastName, city) {
        // Валидация
        if (!Utils.validateEmail(email)) {
            return { success: false, error: 'Некорректный email' };
        }
        if (password.length < 6) {
            return { success: false, error: 'Пароль должен быть не менее 6 символов' };
        }
        if (!firstName || firstName.trim().length === 0) {
            return { success: false, error: 'Укажите имя' };
        }
        if (!lastName || lastName.trim().length === 0) {
            return { success: false, error: 'Укажите фамилию' };
        }
        if (!city || city.trim().length === 0) {
            return { success: false, error: 'Укажите город' };
        }

        const users = Storage.getUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Пользователь с таким email уже существует' };
        }

        // Создание объекта тренера с firstName, lastName, city
        const user = {
            id: Utils.generateId(),
            email: email,
            password: Utils.hashPassword(password),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            city: city.trim(),
            createdAt: new Date().toISOString()
        };
        
        users.push(user);
        Storage.setUsers(users);
        Storage.setCurrentUser(user.id);
        return { success: true, user };
    },

    login(email, password) {
        if (!Utils.validateEmail(email)) {
            return { success: false, error: 'Некорректный email' };
        }
        const users = Storage.getUsers();
        const user = users.find(u => u.email === email);
        if (!user) {
            return { success: false, error: 'Пользователь не найден' };
        }
        if (user.password !== Utils.hashPassword(password)) {
            return { success: false, error: 'Неверный пароль' };
        }
        Storage.setCurrentUser(user.id);
        return { success: true, user };
    },

    logout() {
        Storage.logout();
    }
};

// ============================================
// ATHLETES MODULE
// ============================================
const Athletes = {
    create(data) {
        const currentUser = Storage.getCurrentUser();
        if (!currentUser) return null;
        
        // Извлекаем год из birthDate и сохраняем как Number
        const birthYear = Number(new Date(data.birthDate).getFullYear());
        
        // Объект ученика с birthDate и birthYear
        const athlete = {
            id: Utils.generateId(),
            coachId: currentUser.id,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            birthDate: data.birthDate, // Строка YYYY-MM-DD
            birthYear: birthYear,       // Число
            gender: data.gender,
            createdAt: new Date().toISOString(),
            anthropometry: [],
            skills: {},
            metrics: { potential: 0, realization: 0, gap: 0 },
            shareToken: null
        };
        
        Storage.addAthlete(athlete);
        return athlete;
    },

    addAnthropometry(athleteId, data) {
        const athlete = Storage.getAthleteById(athleteId);
        if (!athlete) return false;
        const anthropometry = {
            date: data.date,
            height: parseFloat(data.height),
            weight: parseFloat(data.weight),
            reach: parseFloat(data.reach)
        };
        athlete.anthropometry.push(anthropometry);
        Storage.updateAthlete(athleteId, { anthropometry: athlete.anthropometry });
        Calculations.updateAthleteMetrics(athleteId);
        return true;
    },

    saveSkills(athleteId, skills) {
        Storage.updateAthlete(athleteId, { skills });
        Calculations.updateAthleteMetrics(athleteId);
        return true;
    },

    getProfile(athleteId) {
        const athlete = Storage.getAthleteById(athleteId);
        if (!athlete) return null;
        return {
            ...athlete,
            strengths: Calculations.getStrengths(athlete),
            weaknesses: Calculations.getWeaknesses(athlete),
            norms: Norms.getNorms(athlete),
            recommendations: Recommendations.generate(athlete)
        };
    },

    getCoachAthletes() {
        return Storage.getCoachAthletes();
    }
};

// ============================================
// SHARE MODULE
// ============================================
const Share = {
    generateShareToken(athleteId) {
        const token = Utils.generateToken(32);
        Storage.updateAthlete(athleteId, { shareToken: token });
        return token;
    },

    getShareUrl(athleteId) {
        let athlete = Storage.getAthleteById(athleteId);
        if (!athlete) return null;
        if (!athlete.shareToken) {
            this.generateShareToken(athleteId);
            athlete = Storage.getAthleteById(athleteId);
        }
        return `${window.location.origin}${window.location.pathname}#student?token=${athlete.shareToken}`;
    },

    getAthleteByToken(token) {
        const athlete = Storage.getAthleteByToken(token);
        if (!athlete) return null;
        return {
            id: athlete.id,
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            birthYear: athlete.birthYear,
            gender: athlete.gender,
            metrics: athlete.metrics,
            anthropometry: athlete.anthropometry,
            skills: athlete.skills,
            strengths: Calculations.getStrengths(athlete),
            weaknesses: Calculations.getWeaknesses(athlete)
        };
    }
};

// ============================================
// SILHOUETTE RENDERER MODULE
// ============================================
const SilhouetteRenderer = {
    render(height, reach, gender) {
        const minHeight = 150;
        const maxHeight = 350;
        const minRealHeight = 140;
        const maxRealHeight = 210;
        const scaledHeight = minHeight + ((height - minRealHeight) / (maxRealHeight - minRealHeight)) * (maxHeight - minHeight);
        const finalHeight = Math.max(minHeight, Math.min(maxHeight, scaledHeight));

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100");
        svg.setAttribute("height", finalHeight);
        svg.setAttribute("viewBox", `0 0 100 ${finalHeight}`);
        svg.style.display = "block";

        const bodyPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const headRadius = 12;
        const headY = headRadius + 5;
        const neckY = headY + headRadius + 3;
        const shoulderY = neckY + 5;
        const waistY = finalHeight * 0.5;
        const hipY = finalHeight * 0.6;
        const footY = finalHeight - 2;

        const pathData = `
            M 50 ${headY}
            m -${headRadius} 0
            a ${headRadius} ${headRadius} 0 1 0 ${headRadius * 2} 0
            a ${headRadius} ${headRadius} 0 1 0 -${headRadius * 2} 0
            M 50 ${neckY}
            L 50 ${waistY}
            M 30 ${shoulderY}
            L 50 ${shoulderY}
            L 70 ${shoulderY}
            M 50 ${waistY}
            L 35 ${hipY}
            L 30 ${footY}
            M 50 ${waistY}
            L 65 ${hipY}
            L 70 ${footY}
        `;

        bodyPath.setAttribute("d", pathData);
        bodyPath.setAttribute("stroke", "#00aaff");
        bodyPath.setAttribute("stroke-width", "3");
        bodyPath.setAttribute("fill", "none");
        bodyPath.setAttribute("stroke-linecap", "round");
        bodyPath.setAttribute("stroke-linejoin", "round");

        svg.appendChild(bodyPath);
        return { svg, height: finalHeight };
    },

    renderRuler(height) {
        const ruler = document.getElementById('height-ruler');
        ruler.innerHTML = '';
        ruler.style.height = `${height}px`;
        for (let cm = 210; cm >= 140; cm -= 10) {
            const mark = document.createElement('div');
            mark.className = cm % 20 === 0 ? 'ruler-mark major' : 'ruler-mark';
            mark.textContent = `${cm}`;
            ruler.appendChild(mark);
        }
    },

    renderReachLine(reach) {
        const reachLine = document.getElementById('reach-line');
        const minWidth = 150;
        const maxWidth = 400;
        const minReach = 140;
        const maxReach = 220;
        const scaledWidth = minWidth + ((reach - minReach) / (maxReach - minReach)) * (maxWidth - minWidth);
        const finalWidth = Math.max(minWidth, Math.min(maxWidth, scaledWidth));
        reachLine.style.width = `${finalWidth}px`;
    },

    calculateApeIndex(height, reach) {
        const ratio = reach / height;
        let description = '';
        if (ratio < 0.98) description = 'Короткие руки';
        else if (ratio >= 0.98 && ratio < 1.0) description = 'Немного короткие руки';
        else if (ratio >= 1.0 && ratio < 1.03) description = 'Пропорциональные руки';
        else if (ratio >= 1.03 && ratio < 1.06) description = 'Хорошо для бокса';
        else description = 'Длинные руки — отличное преимущество!';
        return { ratio: ratio.toFixed(2), description };
    }
};

// ============================================
// ROUTER MODULE
// ============================================
const Router = {
    currentPage: null,
    currentAthleteId: null,

    init() {
        this.setupAuthHandlers();
        window.addEventListener('hashchange', () => this.route());
        this.route();
    },

    route() {
        const { page, params } = Utils.getHashParams();
        document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));

        let targetPage = page || '';
        const isAuthenticated = Storage.getCurrentUser() !== null;

        if (targetPage === 'student') {
            this.showStudentView(params.token);
            return;
        }

        if (!isAuthenticated) {
            targetPage = 'auth';
        } else if (targetPage === '' || targetPage === 'auth') {
            targetPage = 'dashboard';
        }

        this.showPage(targetPage, params);
        this.currentPage = targetPage;
    },

    showPage(page, params = {}) {
        const pageElement = document.getElementById(`page-${page}`);
        if (!pageElement) return;
        pageElement.classList.remove('hidden');

        if (page === 'dashboard') this.initDashboardPage();
        if (page === 'athlete-add') this.initAddAthletePage();
        if (page === 'anthropometry') this.initAnthropometryPage(params.id);
        if (page === 'skills') this.initSkillsPage(params.id);
        if (page === 'profile') this.initProfilePage(params.id);
    },

    showStudentView(token) {
        const pageElement = document.getElementById('page-student-view');
        pageElement.classList.remove('hidden');
        document.getElementById('student-error').classList.add('hidden');

        if (!token) {
            document.getElementById('student-error').classList.remove('hidden');
            return;
        }

        const athleteData = Share.getAthleteByToken(token);
        if (!athleteData) {
            document.getElementById('student-error').classList.remove('hidden');
            return;
        }

        // Отображение: "[birthYear] г.р."
        const genderText = athleteData.gender === 'M' ? 'М' : 'Ж';
        document.getElementById('student-athlete-name').textContent = `${athleteData.firstName} ${athleteData.lastName}`;
        document.getElementById('student-athlete-meta').textContent = `${athleteData.birthYear} г.р., ${genderText}`;

        if (athleteData.anthropometry && athleteData.anthropometry.length > 0) {
            const latest = athleteData.anthropometry[athleteData.anthropometry.length - 1];
            const { svg, height: svgHeight } = SilhouetteRenderer.render(latest.height, latest.reach, athleteData.gender);
            document.getElementById('silhouette-figure').innerHTML = '';
            document.getElementById('silhouette-figure').appendChild(svg);
            SilhouetteRenderer.renderRuler(svgHeight);
            SilhouetteRenderer.renderReachLine(latest.reach);
            document.getElementById('height-value').textContent = `${latest.height} см`;
            document.getElementById('reach-value').textContent = `${latest.reach} см`;
            const apeIndex = SilhouetteRenderer.calculateApeIndex(latest.height, latest.reach);
            document.getElementById('ape-index-value').textContent = apeIndex.ratio;
            document.getElementById('ape-index-desc').textContent = apeIndex.description;
        }

        this.initStudentSections(athleteData);
        document.getElementById('btn-contact-coach').onclick = () => {
            alert('Свяжитесь с вашим тренером для получения подробной информации.');
        };
    },

    initStudentSections(athleteData) {
        const buttons = document.querySelectorAll('.section-button');
        let activeSection = null;

        buttons.forEach(button => {
            button.onclick = () => {
                const section = button.dataset.section;
                const content = document.getElementById(`content-${section}`);

                if (activeSection === section) {
                    content.classList.add('hidden');
                    button.classList.remove('active');
                    activeSection = null;
                    return;
                }

                if (activeSection) {
                    document.getElementById(`content-${activeSection}`).classList.add('hidden');
                    document.querySelector(`[data-section="${activeSection}"]`).classList.remove('active');
                }

                content.classList.remove('hidden');
                button.classList.add('active');
                activeSection = section;

                this.fillSectionContent(section, athleteData);
                content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };
        });
    },

    fillSectionContent(section, athleteData) {
        const container = document.getElementById(`${section}-data`);
        container.innerHTML = '';

        if (section === 'anthropometry') {
            if (!athleteData.anthropometry || athleteData.anthropometry.length === 0) {
                container.innerHTML = '<p style="color: #999;">Данные не внесены</p>';
                return;
            }
            const latest = athleteData.anthropometry[athleteData.anthropometry.length - 1];
            const bmi = (latest.weight / ((latest.height/100) * (latest.height/100))).toFixed(1);
            container.innerHTML = `
                <div class="data-row"><span class="data-row-label">Рост</span><span class="data-row-value">${latest.height} см</span></div>
                <div class="data-row"><span class="data-row-label">Вес</span><span class="data-row-value">${latest.weight} кг</span></div>
                <div class="data-row"><span class="data-row-label">Размах</span><span class="data-row-value">${latest.reach} см</span></div>
                <div class="data-row"><span class="data-row-label">ИМТ</span><span class="data-row-value">${bmi}</span></div>
                <div class="data-row"><span class="data-row-label">Дата</span><span class="data-row-value">${Utils.formatDate(latest.date)}</span></div>
            `;
        }

        if (section === 'physical') {
            if (!athleteData.skills || !athleteData.skills.physical) {
                container.innerHTML = '<p style="color: #999;">Данные не внесены</p>';
                return;
            }
            const physical = athleteData.skills.physical;
            SKILLS_DATA.physical.skills.forEach(skill => {
                const rating = physical[skill.id] || 0;
                const row = document.createElement('div');
                row.className = 'data-row';
                row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                container.appendChild(row);
            });
        }

        if (section === 'functional') {
            if (!athleteData.skills || !athleteData.skills.physical) {
                container.innerHTML = '<p style="color: #999;">Данные не внесены</p>';
                return;
            }
            const physical = athleteData.skills.physical;
            ['reaction', 'coordination', 'flexibility'].forEach(skillId => {
                const skillData = SKILLS_DATA.physical.skills.find(s => s.id === skillId);
                if (!skillData) return;
                const rating = physical[skillId] || 0;
                const row = document.createElement('div');
                row.className = 'data-row';
                row.innerHTML = `<span class="data-row-label">${skillData.name}</span><span class="data-row-value">${rating}/10</span>`;
                container.appendChild(row);
            });

            if (athleteData.skills.footwork) {
                const title = document.createElement('h3');
                title.textContent = 'Работа ног';
                title.style.marginTop = '24px';
                title.style.color = '#00aaff';
                container.appendChild(title);
                const footwork = athleteData.skills.footwork;
                SKILLS_DATA.footwork.skills.forEach(skill => {
                    const rating = footwork[skill.id] || 0;
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                    container.appendChild(row);
                });
            }
        }

        if (section === 'technical') {
            if (!athleteData.skills) {
                container.innerHTML = '<p style="color: #999;">Данные не внесены</p>';
                return;
            }

            if (athleteData.skills.technique) {
                const title = document.createElement('h3');
                title.textContent = 'Техника ударов';
                title.style.color = '#00aaff';
                container.appendChild(title);
                SKILLS_DATA.technique.skills.forEach(skill => {
                    const rating = athleteData.skills.technique[skill.id] || 0;
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                    container.appendChild(row);
                });
            }

            if (athleteData.skills.defense) {
                const title = document.createElement('h3');
                title.textContent = 'Защита';
                title.style.marginTop = '24px';
                title.style.color = '#00aaff';
                container.appendChild(title);
                SKILLS_DATA.defense.skills.forEach(skill => {
                    const rating = athleteData.skills.defense[skill.id] || 0;
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                    container.appendChild(row);
                });
            }

            if (athleteData.skills.tactics) {
                const title = document.createElement('h3');
                title.textContent = 'Тактика';
                title.style.marginTop = '24px';
                title.style.color = '#00aaff';
                container.appendChild(title);
                SKILLS_DATA.tactics.skills.forEach(skill => {
                    const rating = athleteData.skills.tactics[skill.id] || 0;
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                    container.appendChild(row);
                });
            }
        }
    },

    navigate(page, params = {}) {
        let hash = `#${page}`;
        if (Object.keys(params).length > 0) {
            const queryString = Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
            hash += `?${queryString}`;
        }
        window.location.hash = hash;
    },

    // ============================================
    // AUTH HANDLERS
    // ============================================
    setupAuthHandlers() {
        const tabs = document.querySelectorAll('.auth-tabs .tab');
        const coachFieldsGroup = document.getElementById('coach-fields-group');
        const submitBtn = document.getElementById('auth-submit-btn');
        const authForm = document.getElementById('auth-form');
        const errorMessage = document.getElementById('auth-error');
        
        let currentMode = 'login';
        
        // Обработчик переключения табов
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMode = tab.dataset.tab;
                
                // При register показываем поля тренера, при login скрываем
                if (currentMode === 'register') {
                    coachFieldsGroup.classList.remove('hidden');
                    submitBtn.textContent = 'Зарегистрироваться';
                    document.getElementById('first-name-coach').required = true;
                    document.getElementById('last-name-coach').required = true;
                    document.getElementById('city-coach').required = true;
                } else {
                    coachFieldsGroup.classList.add('hidden');
                    submitBtn.textContent = 'Войти';
                    document.getElementById('first-name-coach').required = false;
                    document.getElementById('last-name-coach').required = false;
                    document.getElementById('city-coach').required = false;
                }
                
                errorMessage.classList.add('hidden');
                authForm.reset();
            };
        });
        
        // Обработчик формы авторизации/регистрации
        authForm.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            errorMessage.classList.add('hidden');
            
            let result;
            if (currentMode === 'register') {
                // При регистрации собираем firstName, lastName, city
                const firstName = document.getElementById('first-name-coach').value;
                const lastName = document.getElementById('last-name-coach').value;
                const city = document.getElementById('city-coach').value;
                result = Auth.register(email, password, firstName, lastName, city);
            } else {
                result = Auth.login(email, password);
            }
            
            if (result.success) {
                this.navigate('dashboard');
            } else {
                errorMessage.textContent = result.error;
                errorMessage.classList.remove('hidden');
            }
        };
    },

    // ============================================
    // DASHBOARD PAGE
    // ============================================
    initDashboardPage() {
        const currentUser = Storage.getCurrentUser();
        
        // Имя тренера собирается из firstName и lastName
        const displayName = currentUser.firstName && currentUser.lastName 
            ? `${currentUser.firstName} ${currentUser.lastName}` 
            : currentUser.name || currentUser.email;
        
        document.getElementById('coach-name').textContent = `Тренер: ${displayName}`;
        
        const athletesList = document.getElementById('athletes-list');
        const emptyState = document.getElementById('empty-state');
        const athletes = Athletes.getCoachAthletes();

        if (athletes.length === 0) {
            emptyState.classList.remove('hidden');
            athletesList.innerHTML = '';
        } else {
            emptyState.classList.add('hidden');
            athletesList.innerHTML = '';
            
            athletes.forEach(athlete => {
                const card = document.createElement('div');
                card.className = 'athlete-card';
                const metrics = athlete.metrics || { potential: 0, realization: 0, gap: 0 };
                const genderText = athlete.gender === 'M' ? 'М' : 'Ж';
                
                // Отображение: "[birthYear] г.р."
                card.innerHTML = `
                    <div class="athlete-info">
                        <h3>${athlete.firstName} ${athlete.lastName}</h3>
                        <p class="athlete-meta">${athlete.birthYear} г.р., ${genderText}</p>
                    </div>
                    <div class="athlete-metrics">
                        <div class="metric"><span class="metric-label">Потенциал</span><span class="metric-value">${metrics.potential}</span></div>
                        <div class="metric"><span class="metric-label">Реализация</span><span class="metric-value">${metrics.realization}</span></div>
                        <div class="metric"><span class="metric-label">Разрыв</span><span class="metric-value">${metrics.gap}</span></div>
                    </div>
                `;
                card.onclick = () => this.navigate('profile', { id: athlete.id });
                athletesList.appendChild(card);
            });
        }

        document.getElementById('btn-add-athlete').onclick = () => this.navigate('athlete-add');
        document.getElementById('btn-add-first').onclick = () => this.navigate('athlete-add');
        document.getElementById('btn-logout').onclick = () => {
            if (confirm('Вы уверены, что хотите выйти?')) {
                Auth.logout();
                this.navigate('auth');
            }
        };
    },

    // ============================================
    // ADD ATHLETE PAGE (ШАГ 1)
    // ============================================
    initAddAthletePage() {
        const form = document.getElementById('form-add-athlete');
        
        form.onsubmit = (e) => {
            e.preventDefault();
            
            // Читаем данные из формы (включая birthDate)
            const formData = {
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                birthDate: document.getElementById('birth-date').value, // Дата в формате YYYY-MM-DD
                gender: document.querySelector('input[name="gender"]:checked').value
            };
            
            // Athletes.create() извлечёт birthYear из birthDate
            const athlete = Athletes.create(formData);
            
            if (athlete) {
                localStorage.setItem('currentAthleteId', athlete.id);
                this.navigate('anthropometry', { id: athlete.id });
            } else {
                alert('Ошибка создания спортсмена');
            }
        };
        
        document.getElementById('btn-back-add').onclick = () => this.navigate('dashboard');
        document.getElementById('btn-cancel-add').onclick = () => {
            if (confirm('Отменить?')) this.navigate('dashboard');
        };
    },

    // ============================================
    // ANTHROPOMETRY PAGE (ШАГ 2)
    // ============================================
    initAnthropometryPage(athleteId) {
        if (!athleteId) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }
        
        const athlete = Storage.getAthleteById(athleteId);
        if (!athlete) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }
        
        document.getElementById('anthro-athlete-name').textContent = `${athlete.firstName} ${athlete.lastName}`;
        document.getElementById('measurement-date').value = Utils.getCurrentDate();

        const form = document.getElementById('form-anthropometry');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = {
                height: document.getElementById('height').value,
                weight: document.getElementById('weight').value,
                reach: document.getElementById('reach').value,
                date: document.getElementById('measurement-date').value
            };
            if (Athletes.addAnthropometry(athleteId, formData)) {
                this.navigate('skills', { id: athleteId });
            } else {
                alert('Ошибка сохранения');
            }
        };
        
        document.getElementById('btn-back-anthro').onclick = () => this.navigate('dashboard');
        document.getElementById('btn-cancel-anthro').onclick = () => {
            if (confirm('Отменить?')) {
                Storage.deleteAthlete(athleteId);
                this.navigate('dashboard');
            }
        };
    },

    // ============================================
    // SKILLS PAGE (ШАГ 3)
    // ============================================
    initSkillsPage(athleteId) {
        if (!athleteId) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }
        
        const athlete = Storage.getAthleteById(athleteId);
        if (!athlete) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }
        
        document.getElementById('skills-athlete-name').textContent = `${athlete.firstName} ${athlete.lastName}`;

        const skillsContainer = document.getElementById('skills-container');
        skillsContainer.innerHTML = '';

        Object.keys(SKILLS_DATA).forEach(categoryId => {
            const category = SKILLS_DATA[categoryId];
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'skill-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.name;
            categoryDiv.appendChild(categoryTitle);
            
            category.skills.forEach(skill => {
                const skillDiv = document.createElement('div');
                skillDiv.className = 'skill-item';
                
                const label = document.createElement('label');
                label.setAttribute('for', `skill-${skill.id}`);
                label.textContent = skill.name;
                
                const input = document.createElement('input');
                input.type = 'number';
                input.id = `skill-${skill.id}`;
                input.name = skill.id;
                input.min = 1;
                input.max = 10;
                input.required = true;
                input.dataset.category = categoryId;
                input.value = 5;
                
                skillDiv.appendChild(label);
                skillDiv.appendChild(input);
                categoryDiv.appendChild(skillDiv);
            });
            
            skillsContainer.appendChild(categoryDiv);
        });

        const form = document.getElementById('form-skills');
        form.onsubmit = (e) => {
            e.preventDefault();
            const skills = {};
            
            form.querySelectorAll('input[type="number"]').forEach(input => {
                const categoryId = input.dataset.category;
                const skillId = input.name;
                const rating = parseInt(input.value);
                
                if (!skills[categoryId]) skills[categoryId] = {};
                skills[categoryId][skillId] = rating;
            });
            
            if (Athletes.saveSkills(athleteId, skills)) {
                alert('Спортсмен добавлен!');
                this.navigate('profile', { id: athleteId });
            } else {
                alert('Ошибка сохранения');
            }
        };
        
        document.getElementById('btn-back-skills').onclick = () => this.navigate('dashboard');
        document.getElementById('btn-back-step-skills').onclick = () => {
            if (confirm('Назад? Оценки будут потеряны.')) {
                this.navigate('anthropometry', { id: athleteId });
            }
        };
    },

    // ============================================
    // PROFILE PAGE
    // ============================================
    initProfilePage(athleteId) {
        if (!athleteId) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }

        this.currentAthleteId = athleteId;
        localStorage.setItem('currentAthleteId', athleteId);
        
        const profile = Athletes.getProfile(athleteId);

        if (!profile) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }

        // Отображение: "[birthYear] г.р."
        const genderText = profile.gender === 'M' ? 'М' : 'Ж';
        document.getElementById('profile-athlete-name').textContent = `${profile.firstName} ${profile.lastName}`;
        document.getElementById('profile-athlete-meta').textContent = `${profile.birthYear} г.р., ${genderText}`;

        const metrics = profile.metrics || {};
        document.getElementById('profile-potential').textContent = metrics.potential || '—';
        document.getElementById('profile-realization').textContent = metrics.realization || '—';
        document.getElementById('profile-gap').textContent = metrics.gap || '—';

        // Сильные стороны
        const strengthsList = document.getElementById('profile-strengths');
        strengthsList.innerHTML = '';
        if (profile.strengths && profile.strengths.length > 0) {
            profile.strengths.forEach(strength => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="skill-name">${strength.name}</span><span class="skill-rating">${strength.rating}/10</span>`;
                strengthsList.appendChild(li);
            });
        } else {
            strengthsList.innerHTML = '<li>Данных пока недостаточно</li>';
        }

        // Отстающие зоны
        const weaknessesList = document.getElementById('profile-weaknesses');
        weaknessesList.innerHTML = '';
        if (profile.weaknesses && profile.weaknesses.length > 0) {
            profile.weaknesses.forEach(weakness => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="skill-name">${weakness.name}</span><span class="skill-rating">${weakness.rating}/10</span>`;
                weaknessesList.appendChild(li);
            });
        } else {
            weaknessesList.innerHTML = '<li>Нет критических зон</li>';
        }

        this.initProfileSections(profile);

        // Рекомендации
        const recommendationsDiv = document.getElementById('profile-recommendations');
        recommendationsDiv.innerHTML = '';
        if (profile.recommendations && profile.recommendations.length > 0) {
            profile.recommendations.forEach(rec => {
                const recDiv = document.createElement('div');
                recDiv.className = `recommendation ${rec.type}`;
                recDiv.innerHTML = `<h4>${rec.title}</h4><p>${rec.text}</p>`;
                recommendationsDiv.appendChild(recDiv);
            });
        } else {
            recommendationsDiv.innerHTML = '<p>Рекомендаций пока нет</p>';
        }

        // Кнопки
        document.getElementById('btn-back-profile').onclick = () => this.navigate('dashboard');
        document.getElementById('btn-share').onclick = () => {
            const shareUrl = Share.getShareUrl(athleteId);
            document.getElementById('share-link').value = shareUrl;
            document.getElementById('share-modal').classList.remove('hidden');
        };
        document.getElementById('btn-copy-link').onclick = () => {
            document.getElementById('share-link').select();
            document.execCommand('copy');
            alert('Ссылка скопирована!');
        };
        document.getElementById('btn-close-modal').onclick = () => {
            document.getElementById('share-modal').classList.add('hidden');
        };
    },

    initProfileSections(profile) {
        const buttons = document.querySelectorAll('.profile-section-btn');
        let activeSection = null;

        buttons.forEach(button => {
            button.onclick = () => {
                const section = button.dataset.section;
                const content = document.getElementById(`profile-content-${section}`);

                if (activeSection === section) {
                    content.classList.add('hidden');
                    button.classList.remove('active');
                    activeSection = null;
                    return;
                }

                if (activeSection) {
                    document.getElementById(`profile-content-${activeSection}`).classList.add('hidden');
                    const prevBtn = document.querySelector(`.profile-section-btn[data-section="${activeSection}"]`);
                    if (prevBtn) prevBtn.classList.remove('active');
                }

                content.classList.remove('hidden');
                button.classList.add('active');
                activeSection = section;
                this.fillProfileSectionContent(section, profile);
                content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };
        });
    },

    fillProfileSectionContent(section, profile) {
        const container = document.getElementById(`profile-${section}-data`);
        container.innerHTML = '';

        if (section === 'anthropometry') {
            if (!profile.anthropometry || profile.anthropometry.length === 0) {
                container.innerHTML = '<p style="color: #999;">Данные не внесены</p>';
                return;
            }

            const latest = profile.anthropometry[profile.anthropometry.length - 1];
            const heightM = latest.height / 100;
            const bmi = (latest.weight / (heightM * heightM)).toFixed(1);

            container.innerHTML = `
                <h3 style="color: #0066cc; margin-bottom: 16px;">Текущие показатели</h3>
                <div class="data-row"><span class="data-row-label">Рост</span><span class="data-row-value">${latest.height} см</span></div>
                <div class="data-row"><span class="data-row-label">Вес</span><span class="data-row-value">${latest.weight} кг</span></div>
                <div class="data-row"><span class="data-row-label">Размах</span><span class="data-row-value">${latest.reach} см</span></div>
                <div class="data-row"><span class="data-row-label">ИМТ</span><span class="data-row-value">${bmi}</span></div>
                <div class="data-row"><span class="data-row-label">Дата</span><span class="data-row-value">${Utils.formatDate(latest.date)}</span></div>
            `;

            if (profile.anthropometry.length > 1) {
                const history = document.createElement('div');
                history.style.marginTop = '24px';
                history.innerHTML = '<h3 style="color: #0066cc; margin-bottom: 16px;">История</h3>';
                const table = document.createElement('table');
                table.innerHTML = '<thead><tr><th>Дата</th><th>Рост</th><th>Вес</th><th>Размах</th></tr></thead><tbody></tbody>';
                const tbody = table.querySelector('tbody');
                profile.anthropometry.forEach(entry => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${Utils.formatDate(entry.date)}</td><td>${entry.height} см</td><td>${entry.weight} кг</td><td>${entry.reach} см</td>`;
                    tbody.appendChild(row);
                });
                history.appendChild(table);
                container.appendChild(history);
            }
        }

        if (section === 'physical') {
            if (!profile.skills || !profile.skills.physical) {
                container.innerHTML = '<p style="color: #999;">Данные не внесены</p>';
                return;
            }
            const physical = profile.skills.physical;
            SKILLS_DATA.physical.skills.forEach(skill => {
                const rating = physical[skill.id] || 0;
                const row = document.createElement('div');
                row.className = 'data-row';
                row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                container.appendChild(row);
            });
        }

        if (section === 'functional') {
            if (!profile.skills || !profile.skills.physical) {
                container.innerHTML = '<p style="color: #999;">Данные не внесены</p>';
                return;
            }
            const physical = profile.skills.physical;
            ['reaction', 'coordination', 'flexibility'].forEach(skillId => {
                const skillData = SKILLS_DATA.physical.skills.find(s => s.id === skillId);
                if (!skillData) return;
                const rating = physical[skillId] || 0;
                const row = document.createElement('div');
                row.className = 'data-row';
                row.innerHTML = `<span class="data-row-label">${skillData.name}</span><span class="data-row-value">${rating}/10</span>`;
                container.appendChild(row);
            });

            if (profile.skills.footwork) {
                const title = document.createElement('h3');
                title.textContent = 'Работа ног';
                title.style.marginTop = '24px';
                title.style.color = '#0066cc';
                container.appendChild(title);
                const footwork = profile.skills.footwork;
                SKILLS_DATA.footwork.skills.forEach(skill => {
                    const rating = footwork[skill.id] || 0;
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                    container.appendChild(row);
                });
            }
        }

        if (section === 'technical') {
            if (!profile.skills) {
                container.innerHTML = '<p style="color: #999;">Данные не внесены</p>';
                return;
            }

            if (profile.skills.technique) {
                const title = document.createElement('h3');
                title.textContent = 'Техника ударов';
                title.style.color = '#0066cc';
                container.appendChild(title);
                SKILLS_DATA.technique.skills.forEach(skill => {
                    const rating = profile.skills.technique[skill.id] || 0;
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                    container.appendChild(row);
                });
            }

            if (profile.skills.defense) {
                const title = document.createElement('h3');
                title.textContent = 'Защита';
                title.style.marginTop = '24px';
                title.style.color = '#0066cc';
                container.appendChild(title);
                SKILLS_DATA.defense.skills.forEach(skill => {
                    const rating = profile.skills.defense[skill.id] || 0;
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                    container.appendChild(row);
                });
            }

            if (profile.skills.tactics) {
                const title = document.createElement('h3');
                title.textContent = 'Тактика';
                title.style.marginTop = '24px';
                title.style.color = '#0066cc';
                container.appendChild(title);
                SKILLS_DATA.tactics.skills.forEach(skill => {
                    const rating = profile.skills.tactics[skill.id] || 0;
                    const row = document.createElement('div');
                    row.className = 'data-row';
                    row.innerHTML = `<span class="data-row-label">${skill.name}</span><span class="data-row-value">${rating}/10</span>`;
                    container.appendChild(row);
                });
            }
        }
    }
};

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
});
