'use strict';

// ============================================
// FIREBASE INITIALIZATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyAxsNe0j6NxMwLDeWrFpvdqRbBHFg5gdiw",
    authDomain: "cartel-academy.firebaseapp.com",
    projectId: "cartel-academy",
    storageBucket: "cartel-academy.firebasestorage.app",
    messagingSenderId: "988659631950",
    appId: "1:988659631950:web:ffb7ec4d4b5e0ec440401f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================
// STORAGE MODULE (FIREBASE WRAPPER)
// ============================================
const Storage = {
    currentUser: null,

    async getCurrentUser() {
        if (!auth.currentUser) return null;
        if (this.currentUser) return this.currentUser;
        
        const uid = auth.currentUser.uid;
        const doc = await db.collection('coaches').doc(uid).get();
        if (!doc.exists) return null;
        
        this.currentUser = {
            id: uid,
            ...doc.data()
        };
        return this.currentUser;
    },

    async setCurrentUserProfile(data) {
        if (!auth.currentUser) return false;
        const uid = auth.currentUser.uid;
        await db.collection('coaches').doc(uid).set(data);
        this.currentUser = { id: uid, ...data };
        return true;
    },

    logout() {
        this.currentUser = null;
        return auth.signOut();
    },

    async getCoachAthletes() {
        if (!auth.currentUser) return [];
        const snapshot = await db.collection('students')
            .where('coachId', '==', auth.currentUser.uid)
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async getAthleteById(id) {
        const doc = await db.collection('students').doc(id).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    async getAthleteByToken(token) {
        const snapshot = await db.collection('students')
            .where('shareToken', '==', token)
            .limit(1)
            .get();
        
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    async addAthlete(athlete) {
        const docRef = await db.collection('students').add(athlete);
        return { id: docRef.id, ...athlete };
    },

    async updateAthlete(id, updates) {
        await db.collection('students').doc(id).update(updates);
        return true;
    },

    async deleteAthlete(id) {
        await db.collection('students').doc(id).delete();
        return true;
    }
};

// ============================================
// UTILITIES MODULE
// ============================================
const Utils = {
    generateId() {
        return db.collection('_').doc().id;
    },

    generateToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < length; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
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

    calculateAge(birthYear) {
        return new Date().getFullYear() - birthYear;
    },

    showLoader() {
        document.body.style.cursor = 'wait';
    },

    hideLoader() {
        document.body.style.cursor = 'default';
    }
};
// ============================================
// BOXING BENCHMARKS DATABASE
// ============================================
const BOXING_BENCHMARKS = {
    M: {
        '13-14': [
            { weight: 37, idealHeight: 153 },
            { weight: 40, idealHeight: 156 },
            { weight: 42, idealHeight: 158 },
            { weight: 44, idealHeight: 161 },
            { weight: 46, idealHeight: 164 },
            { weight: 48, idealHeight: 167 },
            { weight: 50, idealHeight: 170 },
            { weight: 52, idealHeight: 172 },
            { weight: 54, idealHeight: 174 },
            { weight: 57, idealHeight: 176 },
            { weight: 60, idealHeight: 178 },
            { weight: 63, idealHeight: 181 },
            { weight: 66, idealHeight: 183 },
            { weight: 70, idealHeight: 185 },
            { weight: 75, idealHeight: 188 },
            { weight: 80, idealHeight: 191 },
            { weight: 90, idealHeight: 194 }
        ],
        '15-16': [
            { weight: 44, idealHeight: 160 },
            { weight: 46, idealHeight: 162 },
            { weight: 48, idealHeight: 164 },
            { weight: 50, idealHeight: 167 },
            { weight: 52, idealHeight: 170 },
            { weight: 54, idealHeight: 172 },
            { weight: 57, idealHeight: 175 },
            { weight: 60, idealHeight: 177 },
            { weight: 63, idealHeight: 179 },
            { weight: 66, idealHeight: 181 },
            { weight: 70, idealHeight: 183 },
            { weight: 75, idealHeight: 186 },
            { weight: 80, idealHeight: 189 },
            { weight: 90, idealHeight: 192 }
        ],
        '17-18': [
            { weight: 48, idealHeight: 162 },
            { weight: 51, idealHeight: 165 },
            { weight: 54, idealHeight: 168 },
            { weight: 57, idealHeight: 171 },
            { weight: 60, idealHeight: 174 },
            { weight: 63.5, idealHeight: 176 },
            { weight: 67, idealHeight: 178 },
            { weight: 71, idealHeight: 181 },
            { weight: 75, idealHeight: 183 },
            { weight: 80, idealHeight: 186 },
            { weight: 86, idealHeight: 189 },
            { weight: 92, idealHeight: 192 },
            { weight: 100, idealHeight: 195 }
        ],
        '19-22': [
            { weight: 48, idealHeight: 162 },
            { weight: 51, idealHeight: 165 },
            { weight: 54, idealHeight: 168 },
            { weight: 57, idealHeight: 171 },
            { weight: 60, idealHeight: 174 },
            { weight: 63.5, idealHeight: 176 },
            { weight: 67, idealHeight: 178 },
            { weight: 71, idealHeight: 181 },
            { weight: 75, idealHeight: 183 },
            { weight: 80, idealHeight: 186 },
            { weight: 86, idealHeight: 189 },
            { weight: 92, idealHeight: 192 },
            { weight: 100, idealHeight: 195 }
        ]
    },
    F: {
        '13-14': [
            { weight: 34, idealHeight: 158 },
            { weight: 36, idealHeight: 161 },
            { weight: 38, idealHeight: 163 },
            { weight: 40, idealHeight: 165 },
            { weight: 42, idealHeight: 167 },
            { weight: 44, idealHeight: 169 },
            { weight: 46, idealHeight: 170 },
            { weight: 48, idealHeight: 172 },
            { weight: 51, idealHeight: 174 },
            { weight: 54, idealHeight: 176 },
            { weight: 57, idealHeight: 178 },
            { weight: 60, idealHeight: 180 },
            { weight: 64, idealHeight: 183 },
            { weight: 70, idealHeight: 185 }
        ],
        '15-16': [
            { weight: 44, idealHeight: 166 },
            { weight: 46, idealHeight: 168 },
            { weight: 48, idealHeight: 169 },
            { weight: 50, idealHeight: 171 },
            { weight: 52, idealHeight: 172 },
            { weight: 54, idealHeight: 173 },
            { weight: 57, idealHeight: 174 },
            { weight: 60, idealHeight: 175 },
            { weight: 63, idealHeight: 176 },
            { weight: 66, idealHeight: 177 },
            { weight: 70, idealHeight: 178 },
            { weight: 75, idealHeight: 180 },
            { weight: 80, idealHeight: 182 },
            { weight: 90, idealHeight: 185 }
        ],
        '17-18': [
            { weight: 48, idealHeight: 164 },
            { weight: 50, idealHeight: 168 },
            { weight: 52, idealHeight: 170 },
            { weight: 54, idealHeight: 171 },
            { weight: 57, idealHeight: 172 },
            { weight: 60, idealHeight: 173 },
            { weight: 63, idealHeight: 174 },
            { weight: 66, idealHeight: 175 },
            { weight: 70, idealHeight: 176 },
            { weight: 75, idealHeight: 178 },
            { weight: 81, idealHeight: 180 },
            { weight: 90, idealHeight: 183 }
        ],
        '19-22': [
            { weight: 48, idealHeight: 164 },
            { weight: 50, idealHeight: 168 },
            { weight: 52, idealHeight: 170 },
            { weight: 54, idealHeight: 171 },
            { weight: 57, idealHeight: 172 },
            { weight: 60, idealHeight: 173 },
            { weight: 63, idealHeight: 174 },
            { weight: 66, idealHeight: 175 },
            { weight: 70, idealHeight: 176 },
            { weight: 75, idealHeight: 178 },
            { weight: 81, idealHeight: 180 },
            { weight: 90, idealHeight: 183 }
        ]
    }
};

// Вспомогательные функции для работы с BOXING_BENCHMARKS
function getAgeGroup(birthYear) {
    const age = new Date().getFullYear() - birthYear;
    if (age >= 13 && age <= 14) return '13-14';
    if (age >= 15 && age <= 16) return '15-16';
    if (age >= 17 && age <= 18) return '17-18';
    if (age >= 19) return '19-22';
    return null;
}

function findWeightCategory(gender, ageGroup, weight) {
    if (!BOXING_BENCHMARKS[gender] || !BOXING_BENCHMARKS[gender][ageGroup]) return null;
    
    const categories = BOXING_BENCHMARKS[gender][ageGroup];
    
    // ✅ ИСПРАВЛЕНО: Ищем ВВЕРХ (ceiling), не ближайшее
    // Находим первую категорию, где верхняя граница >= текущему весу
    for (let cat of categories) {
        if (weight <= cat.weight) {
            return cat;
        }
    }
    
    // Если вес больше всех категорий, возвращаем последнюю + маркер
    const lastCat = categories[categories.length - 1];
    return {
        weight: `${lastCat.weight}+`,
        idealHeight: lastCat.idealHeight
    };
}


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
        
        const ageGroup = getAgeGroup(athlete.birthYear);
        if (!ageGroup) return 0;
        
        const category = findWeightCategory(athlete.gender, ageGroup, weight);
        if (!category) return 0;
        
        const idealHeight = category.idealHeight;
        
        // НОВАЯ ФОРМУЛА
        let potential = 100;
        
        // Штраф за рост: −5% за каждый 1 см ниже idealHeight
        const heightDiff = idealHeight - height;
        if (heightDiff > 0) {
            potential -= heightDiff * 5;
        }
        
        // Штраф за размах: −4% за каждый 1 см отрицательного Ape Index
        const apeIndex = reach - height;
        if (apeIndex < 0) {
            potential -= Math.abs(apeIndex) * 4;
        }
        
        // Нижний порог: не ниже 10%
        potential = Math.max(10, potential);
        
        return Math.round(potential);
    },

    calculateRealization(athlete) {
        if (!athlete.skills) return "Нет данных";
        
        let atomsSum = 0, atomsCount = 0;
        let ofpSum = 0, ofpCount = 0;
        
        // Технические атомы: technique, defense, tactics
        ['technique', 'defense', 'tactics'].forEach(cat => {
            if (athlete.skills[cat]) {
                Object.values(athlete.skills[cat]).forEach(rating => {
                    if (typeof rating === 'number') {
                        atomsSum += rating;
                        atomsCount++;
                    }
                });
            }
        });
        
        // ОФП: physical
        if (athlete.skills.physical) {
            Object.values(athlete.skills.physical).forEach(rating => {
                if (typeof rating === 'number') {
                    ofpSum += rating;
                    ofpCount++;
                }
            });
        }
        
        // Если нет данных ни по атомам, ни по ОФП → "Нет данных"
        if (atomsCount === 0 || ofpCount === 0) {
            return "Нет данных";
        }
        
        const avgAtoms = atomsSum / atomsCount;
        const avgOFP = ofpSum / ofpCount;
        const avgTotal = (avgAtoms + avgOFP) / 2;
        
        // Переводим в проценты (из 10-балльной шкалы)
        return Math.round((avgTotal / 10) * 100);
    },

    calculateGap(potential, realization) {
        if (realization === "Нет данных") {
            return "Нет данных";
        }
        return potential - realization;
    },

    async updateAthleteMetrics(athleteId) {
        const athlete = await Storage.getAthleteById(athleteId);
        if (!athlete) return null;
        
        const potential = this.calculatePotential(athlete);
        const realization = this.calculateRealization(athlete);
        const gap = this.calculateGap(potential, realization);
        
        const metrics = { potential, realization, gap };
        await Storage.updateAthlete(athleteId, { metrics });
        return metrics;
    },

    getWeightCategory(athlete) {
        if (!athlete.anthropometry || athlete.anthropometry.length === 0) return null;
        
        const latest = athlete.anthropometry[athlete.anthropometry.length - 1];
        const ageGroup = getAgeGroup(athlete.birthYear);
        if (!ageGroup) return null;
        
        const category = findWeightCategory(athlete.gender, ageGroup, latest.weight);
        return category ? `${category.weight} кг` : null;
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
// AUTH MODULE (FIREBASE)
// ============================================
const AuthModule = {
    async register(email, password, firstName, lastName, city) {
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

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;
            
            const coachData = {
                email: email,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                city: city.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('coaches').doc(uid).set(coachData);
            
            return { success: true, user: { id: uid, ...coachData } };
        } catch (error) {
            console.error('Firebase register error:', error);
            let errorMsg = 'Ошибка регистрации';
            if (error.code === 'auth/email-already-in-use') {
                errorMsg = 'Пользователь с таким email уже существует';
            } else if (error.code === 'auth/weak-password') {
                errorMsg = 'Слишком простой пароль';
            }
            return { success: false, error: errorMsg };
        }
    },

    async login(email, password) {
        if (!Utils.validateEmail(email)) {
            return { success: false, error: 'Некорректный email' };
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (error) {
            console.error('Firebase login error:', error);
            let errorMsg = 'Ошибка входа';
            if (error.code === 'auth/user-not-found') {
                errorMsg = 'Пользователь не найден';
            } else if (error.code === 'auth/wrong-password') {
                errorMsg = 'Неверный пароль';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'Некорректный email';
            } else if (error.code === 'auth/invalid-credential') {
                errorMsg = 'Неверный email или пароль';
            }
            return { success: false, error: errorMsg };
        }
    },

    async logout() {
        await Storage.logout();
    }
};

// ============================================
// ATHLETES MODULE (ASYNC)
// ============================================
const Athletes = {
    async create(data) {
        if (!auth.currentUser) return null;
        
        const athlete = {
            coachId: auth.currentUser.uid,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            birthYear: parseInt(data.birthYear),
            gender: data.gender,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            anthropometry: [],
            skills: {},
            metrics: { potential: 0, realization: 0, gap: 0 },
            shareToken: null
        };
        
        return await Storage.addAthlete(athlete);
    },

    async addAnthropometry(athleteId, data) {
        const athlete = await Storage.getAthleteById(athleteId);
        if (!athlete) return false;
        
        const anthropometry = {
            date: data.date,
            height: parseFloat(data.height),
            weight: parseFloat(data.weight),
            reach: parseFloat(data.reach)
        };
        
        const updatedAnthro = [...(athlete.anthropometry || []), anthropometry];
        await Storage.updateAthlete(athleteId, { anthropometry: updatedAnthro });
        await Calculations.updateAthleteMetrics(athleteId);
        return true;
    },

    async saveSkills(athleteId, skills) {
        await Storage.updateAthlete(athleteId, { skills });
        await Calculations.updateAthleteMetrics(athleteId);
        return true;
    },

    async getProfile(athleteId) {
        const athlete = await Storage.getAthleteById(athleteId);
        if (!athlete) return null;
        return {
            ...athlete,
            strengths: Calculations.getStrengths(athlete),
            weaknesses: Calculations.getWeaknesses(athlete),
            norms: Norms.getNorms(athlete),
            recommendations: Recommendations.generate(athlete)
        };
    },

    async getCoachAthletes() {
        return await Storage.getCoachAthletes();
    }
};

// ============================================
// SHARE MODULE
// ============================================
const Share = {
    async generateShareToken(athleteId) {
        const token = Utils.generateToken(32);
        await Storage.updateAthlete(athleteId, { shareToken: token });
        return token;
    },

    async getShareUrl(athleteId) {
        let athlete = await Storage.getAthleteById(athleteId);
        if (!athlete) return null;
        if (!athlete.shareToken) {
            await this.generateShareToken(athleteId);
            athlete = await Storage.getAthleteById(athleteId);
        }
        return `${window.location.origin}${window.location.pathname}#student?token=${athlete.shareToken}`;
    },

    async getAthleteByToken(token) {
        const athlete = await Storage.getAthleteByToken(token);
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
        if (!ruler) return;
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
        if (!reachLine) return;
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
// ROUTER MODULE (ASYNC)
// ============================================
const Router = {
    currentPage: null,
    currentAthleteId: null,
    authInitialized: false,

    init() {
        // КРИТИЧНО: Ждем onAuthStateChanged ПЕРЕД роутингом
        auth.onAuthStateChanged(user => {
            console.log('Auth state changed:', user ? user.email : 'No user');
            
            if (!this.authInitialized) {
                this.authInitialized = true;
                this.setupAuthHandlers();
                window.addEventListener('hashchange', () => this.route());
            }
            
            const { page } = Utils.getHashParams();
            
            if (user) {
                // Пользователь авторизован
                if (!page || page === 'auth') {
                    this.navigate('dashboard');
                } else {
                    this.route();
                }
            } else {
                // Пользователь НЕ авторизован
                if (page === 'student') {
                    // Разрешаем просмотр ученика без авторизации
                    this.route();
                } else {
                    this.showAuthPage();
                }
            }
        });
    },

    showAuthPage() {
        document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
        document.getElementById('page-auth').classList.remove('hidden');
        this.currentPage = 'auth';
    },

    async route() {
        const { page, params } = Utils.getHashParams();
        document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));

        let targetPage = page || '';

        if (targetPage === 'student') {
            await this.showStudentView(params.token);
            return;
        }

        if (!auth.currentUser) {
            this.showAuthPage();
            return;
        }

        if (targetPage === '' || targetPage === 'auth') {
            targetPage = 'dashboard';
        }

        await this.showPage(targetPage, params);
        this.currentPage = targetPage;
    },

    async showPage(page, params = {}) {
        const pageElement = document.getElementById(`page-${page}`);
        if (!pageElement) return;
        pageElement.classList.remove('hidden');

        if (page === 'dashboard') await this.initDashboardPage();
        if (page === 'athlete-add') this.initAddAthletePage();
        if (page === 'anthropometry') await this.initAnthropometryPage(params.id);
        if (page === 'skills') await this.initSkillsPage(params.id);
        if (page === 'profile') await this.initProfilePage(params.id);
    },

    async showStudentView(token) {
        const pageElement = document.getElementById('page-student-view');
        pageElement.classList.remove('hidden');
        document.getElementById('student-error').classList.add('hidden');

        if (!token) {
            document.getElementById('student-error').classList.remove('hidden');
            return;
        }

        const athleteData = await Share.getAthleteByToken(token);
        if (!athleteData) {
            document.getElementById('student-error').classList.remove('hidden');
            return;
        }

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
        const buttons = document.querySelectorAll('#page-student-view .section-button');
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
                    const prevBtn = document.querySelector(`[data-section="${activeSection}"]`);
                    if (prevBtn) prevBtn.classList.remove('active');
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

    setupAuthHandlers() {
        const tabs = document.querySelectorAll('.auth-tabs .tab');
        const coachFieldsGroup = document.getElementById('coach-fields-group');
        const submitBtn = document.getElementById('auth-submit-btn');
        const authForm = document.getElementById('auth-form');
        const errorMessage = document.getElementById('auth-error');
        
        let currentMode = 'login';
        
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMode = tab.dataset.tab;
                
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
        
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            errorMessage.classList.add('hidden');
            Utils.showLoader();
            
            let result;
            if (currentMode === 'register') {
                const firstName = document.getElementById('first-name-coach').value;
                const lastName = document.getElementById('last-name-coach').value;
                const city = document.getElementById('city-coach').value;
                result = await AuthModule.register(email, password, firstName, lastName, city);
            } else {
                result = await AuthModule.login(email, password);
            }
            
            Utils.hideLoader();
            
            if (result.success) {
                // ✅ ИСПРАВЛЕНО: Router.navigate вместо this.navigate
                Router.navigate('dashboard');
            } else {
                errorMessage.textContent = result.error;
                errorMessage.classList.remove('hidden');
            }
        };
    },

    async initDashboardPage() {
    Utils.showLoader();
    
    const currentUser = await Storage.getCurrentUser();
    const displayName = currentUser.firstName && currentUser.lastName 
        ? `${currentUser.firstName} ${currentUser.lastName}` 
        : currentUser.email;
    
    document.getElementById('coach-name').textContent = `Тренер: ${displayName}`;
    
    const athletesList = document.getElementById('athletes-list');
    const emptyState = document.getElementById('empty-state');
    const athletes = await Athletes.getCoachAthletes();

    if (athletes.length === 0) {
        emptyState.classList.remove('hidden');
        athletesList.innerHTML = '';
    } else {
        emptyState.classList.add('hidden');
        athletesList.innerHTML = '';
        
        // ✅ ИСПРАВЛЕНО: Пересчитываем метрики для каждого спортсмена
        for (const athlete of athletes) {
            // Вычисляем актуальные метрики
            const potential = Calculations.calculatePotential(athlete);
            const realization = Calculations.calculateRealization(athlete);
            const gap = Calculations.calculateGap(potential, realization);
            
            const card = document.createElement('div');
            card.className = 'athlete-card';
            const genderText = athlete.gender === 'M' ? 'М' : 'Ж';
            
            // Форматируем отображение
            const realizationDisplay = realization === "Нет данных" ? "Нет данных" : realization;
            const gapDisplay = gap === "Нет данных" ? "Нет данных" : gap;
            
            card.innerHTML = `
                <div class="athlete-info">
                    <h3>${athlete.firstName} ${athlete.lastName}</h3>
                    <p class="athlete-meta">${athlete.birthYear} г.р., ${genderText}</p>
                </div>
                <div class="athlete-metrics">
                    <div class="metric"><span class="metric-label">Потенциал</span><span class="metric-value">${potential}</span></div>
                    <div class="metric"><span class="metric-label">Реализация</span><span class="metric-value">${realizationDisplay}</span></div>
                    <div class="metric"><span class="metric-label">Разрыв</span><span class="metric-value">${gapDisplay}</span></div>
                </div>
            `;
            card.onclick = () => this.navigate('profile', { id: athlete.id });
            athletesList.appendChild(card);
        }
    }

    document.getElementById('btn-add-athlete').onclick = () => this.navigate('athlete-add');
    document.getElementById('btn-add-first').onclick = () => this.navigate('athlete-add');
    document.getElementById('btn-logout').onclick = async () => {
        if (confirm('Вы уверены, что хотите выйти?')) {
            await AuthModule.logout();
        }
    };
    
    Utils.hideLoader();
}


    initAddAthletePage() {
        const form = document.getElementById('form-add-athlete');
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const birthYear = parseInt(document.getElementById('birth-year').value);
            const currentYear = new Date().getFullYear();
            
            if (birthYear < 1950 || birthYear > currentYear) {
                alert(`Укажите корректный год рождения (1950-${currentYear})`);
                return;
            }
            
            if (birthYear > currentYear - 5) {
                if (!confirm('Спортсмену меньше 5 лет. Продолжить?')) {
                    return;
                }
            }
            
            Utils.showLoader();
            
            const formData = {
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                birthYear: birthYear,
                gender: document.querySelector('input[name="gender"]:checked').value
            };
            
            const athlete = await Athletes.create(formData);
            
            Utils.hideLoader();
            
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

    async initAnthropometryPage(athleteId) {
        if (!athleteId) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }
        
        Utils.showLoader();
        const athlete = await Storage.getAthleteById(athleteId);
        Utils.hideLoader();
        
        if (!athlete) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }
        
        document.getElementById('anthro-athlete-name').textContent = `${athlete.firstName} ${athlete.lastName}`;
        document.getElementById('measurement-date').value = Utils.getCurrentDate();

        const form = document.getElementById('form-anthropometry');
        form.onsubmit = async (e) => {
            e.preventDefault();
            Utils.showLoader();
            
            const formData = {
                height: document.getElementById('height').value,
                weight: document.getElementById('weight').value,
                reach: document.getElementById('reach').value,
                date: document.getElementById('measurement-date').value
            };
            
            const success = await Athletes.addAnthropometry(athleteId, formData);
            Utils.hideLoader();
            
            if (success) {
                this.navigate('skills', { id: athleteId });
            } else {
                alert('Ошибка сохранения');
            }
        };
        
        document.getElementById('btn-back-anthro').onclick = () => this.navigate('dashboard');
        document.getElementById('btn-cancel-anthro').onclick = async () => {
            if (confirm('Отменить?')) {
                Utils.showLoader();
                await Storage.deleteAthlete(athleteId);
                Utils.hideLoader();
                this.navigate('dashboard');
            }
        };
    },

    async initSkillsPage(athleteId) {
        if (!athleteId) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }
        
        Utils.showLoader();
        const athlete = await Storage.getAthleteById(athleteId);
        Utils.hideLoader();
        
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
        form.onsubmit = async (e) => {
            e.preventDefault();
            Utils.showLoader();
            
            const skills = {};
            form.querySelectorAll('input[type="number"]').forEach(input => {
                const categoryId = input.dataset.category;
                const skillId = input.name;
                const rating = parseInt(input.value);
                
                if (!skills[categoryId]) skills[categoryId] = {};
                skills[categoryId][skillId] = rating;
            });
            
            const success = await Athletes.saveSkills(athleteId, skills);
            Utils.hideLoader();
            
            if (success) {
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

    async initProfilePage(athleteId) {
    if (!athleteId) {
        alert('Спортсмен не найден');
        this.navigate('dashboard');
        return;
    }

    this.currentAthleteId = athleteId;
    localStorage.setItem('currentAthleteId', athleteId);
    
    Utils.showLoader();
    const athlete = await Storage.getAthleteById(athleteId);
    Utils.hideLoader();

    if (!athlete) {
        alert('Спортсмен не найден');
        this.navigate('dashboard');
        return;
    }

    const genderText = athlete.gender === 'M' ? 'М' : 'Ж';
    document.getElementById('profile-athlete-name').textContent = `${athlete.firstName} ${athlete.lastName}`;
    document.getElementById('profile-athlete-meta').textContent = `${athlete.birthYear} г.р., ${genderText}`;

    // ✅ ИСПРАВЛЕНО: Вычисляем актуальные метрики
    const potential = Calculations.calculatePotential(athlete);
    const realization = Calculations.calculateRealization(athlete);
    const gap = Calculations.calculateGap(potential, realization);
    
    // Форматируем отображение
    const realizationDisplay = realization === "Нет данных" ? "Нет данных" : realization;
    const gapDisplay = gap === "Нет данных" ? "Нет данных" : gap;

    document.getElementById('profile-potential').textContent = potential || '—';
    document.getElementById('profile-realization').textContent = realizationDisplay;
    document.getElementById('profile-gap').textContent = gapDisplay;

    // Генерация кнопок секций
    const sectionsGrid = document.getElementById('profile-sections-grid');
    if (sectionsGrid) {
        sectionsGrid.innerHTML = `
            <a href="anthropometry.html?id=${athleteId}" class="section-button">
                <div class="section-button-icon">📏</div>
                <div class="section-button-title">Антропометрия</div>
                <div class="section-button-subtitle">Параметры и история</div>
            </a>
            <a href="physical.html?id=${athleteId}" class="section-button">
                <div class="section-button-icon">💪</div>
                <div class="section-button-title">Физическое развитие</div>
                <div class="section-button-subtitle">Сила и выносливость</div>
            </a>
            <a href="functional.html?id=${athleteId}" class="section-button">
                <div class="section-button-icon">⚡</div>
                <div class="section-button-title">Функциональная готовность</div>
                <div class="section-button-subtitle">Скорость и реакция</div>
            </a>
            <a href="technical.html?id=${athleteId}" class="section-button">
                <div class="section-button-icon">🥊</div>
                <div class="section-button-title">Техническая подготовленность</div>
                <div class="section-button-subtitle">Навыки и тактика</div>
            </a>
        `;
    }

    // Рекомендации (если есть данные для их генерации)
    const recommendationsDiv = document.getElementById('profile-recommendations');
    recommendationsDiv.innerHTML = '';
    
    if (realization !== "Нет данных") {
        const recommendations = Recommendations.generate({
            ...athlete,
            metrics: { potential, realization, gap }
        });
        
        if (recommendations.length > 0) {
            recommendations.forEach(rec => {
                const recDiv = document.createElement('div');
                recDiv.className = `recommendation ${rec.type}`;
                recDiv.innerHTML = `<h4>${rec.title}</h4><p>${rec.text}</p>`;
                recommendationsDiv.appendChild(recDiv);
            });
        } else {
            recommendationsDiv.innerHTML = '<p>Рекомендаций пока нет</p>';
        }
    } else {
        recommendationsDiv.innerHTML = '<p>Для формирования рекомендаций необходимо внести оценки по ОФП и техническим навыкам</p>';
    }

    // Кнопки
    document.getElementById('btn-back-profile').onclick = () => this.navigate('dashboard');
    document.getElementById('btn-share').onclick = async () => {
        const url = await Share.getShareUrl(athleteId);
        if (url) {
            document.getElementById('share-link').value = url;
            document.getElementById('share-modal').classList.remove('hidden');
        }
    };

    document.getElementById('btn-copy-link').onclick = () => {
        const linkInput = document.getElementById('share-link');
        linkInput.select();
        document.execCommand('copy');
        alert('Ссылка скопирована!');
    };

    document.getElementById('btn-close-modal').onclick = () => {
        document.getElementById('share-modal').classList.add('hidden');
    };
}


};

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
});
