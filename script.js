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
// GOOGLE SHEETS URL (Лист "Нормативы")
// ============================================
const NORMS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSznwbE_UU03tW5O2ps783zQ_V6lXjGnx7IdqYCTfF7XRN6ioJ7EQ4kclNSyrok2Yu2CGXr4M4qGzcs/pub?gid=1658605285&single=true&output=csv';

// ============================================
// NORMS MODULE (ЗАГРУЗКА ИЗ GOOGLE SHEETS)
// ============================================
const NormsLoader = {
    cache: null,
    
    async loadNorms() {
        if (this.cache) return this.cache;
        
        try {
            const response = await fetch(NORMS_SHEET_URL);
            const csvText = await response.text();
            const rows = csvText.split('\n').map(row => row.split(','));
            
            // Пропускаем заголовок
            const dataRows = rows.slice(1);
            
            const norms = [];
            dataRows.forEach(row => {
                if (row.length < 10) return;
                
                const [category, testId, testName, description, ageGroup, gender, gold, silver, bronze, unit, measureType] = row;
                
                norms.push({
                    category: category.trim(),
                    testId: testId.trim(),
                    testName: testName.trim(),
                    description: description.trim(),
                    ageGroup: ageGroup.trim(),
                    gender: gender.trim(),
                    gold: parseFloat(gold),
                    silver: parseFloat(silver),
                    bronze: parseFloat(bronze),
                    unit: unit.trim(),
                    measureType: measureType.trim() // MAX или MIN
                });
            });
            
            this.cache = norms;
            return norms;
        } catch (error) {
            console.error('Ошибка загрузки нормативов:', error);
            return [];
        }
    },
    
    async getNormsForAthlete(athlete, category) {
        const allNorms = await this.loadNorms();
        const age = new Date().getFullYear() - athlete.birthYear;
        
        return allNorms.filter(norm => {
            if (norm.category !== category) return false;
            if (norm.gender !== athlete.gender) return false;
            
            // Парсинг возрастной группы (например "13-14")
            const [minAge, maxAge] = norm.ageGroup.split('-').map(n => parseInt(n));
            return age >= minAge && age <= maxAge;
        });
    }
};

// ============================================
// TEST EVALUATION MODULE
// ============================================
const TestEvaluator = {
    evaluateTest(result, norm) {
        const { gold, silver, bronze, measureType } = norm;
        
        let status, normalizedScore;
        
        if (measureType === 'MAX') {
            // Больше = Лучше
            if (result >= gold) {
                status = 'gold';
                normalizedScore = 100;
            } else if (result >= silver) {
                status = 'silver';
                normalizedScore = 80;
            } else if (result >= bronze) {
                status = 'bronze';
                normalizedScore = 60;
            } else {
                status = 'red';
                normalizedScore = Math.max(0, (result / bronze) * 60);
            }
            
            // Дополнительная нормализация для золота
            if (result > gold) {
                normalizedScore = 100 + ((result - gold) / gold) * 20;
                normalizedScore = Math.min(120, normalizedScore);
            }
        } else {
            // Меньше = Лучше (MIN)
            if (result <= gold) {
                status = 'gold';
                normalizedScore = 100;
            } else if (result <= silver) {
                status = 'silver';
                normalizedScore = 80;
            } else if (result <= bronze) {
                status = 'bronze';
                normalizedScore = 60;
            } else {
                status = 'red';
                normalizedScore = Math.max(0, (bronze / result) * 60);
            }
            
            // Дополнительная нормализация для золота
            if (result < gold) {
                normalizedScore = 100 + ((gold - result) / gold) * 20;
                normalizedScore = Math.min(120, normalizedScore);
            }
        }
        
        return {
            status,
            normalizedScore: Math.round(normalizedScore),
            color: this.getStatusColor(status)
        };
    },
    
    getStatusColor(status) {
        const colors = {
            gold: '#4caf50',    // Зеленый
            silver: '#ffeb3b',  // Желтый
            bronze: '#ff9800',  // Оранжевый
            red: '#f44336'      // Красный
        };
        return colors[status] || '#999';
    },
    
    getStatusText(status) {
        const texts = {
            gold: 'Золото (Элита)',
            silver: 'Серебро (Норма)',
            bronze: 'Бронза (Ниже нормы)',
            red: 'Критическое отставание'
        };
        return texts[status] || 'Не оценено';
    }
};

// ============================================
// STORAGE MODULE
// ============================================
const Storage = {
    currentUser: null,

    async getCurrentUser() {
        if (!auth.currentUser) return null;
        if (this.currentUser) return this.currentUser;
        
        const uid = auth.currentUser.uid;
        const doc = await db.collection('coaches').doc(uid).get();
        if (!doc.exists) return null;
        
        this.currentUser = { id: uid, ...doc.data() };
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
    
    for (let cat of categories) {
        if (weight <= cat.weight) {
            return cat;
        }
    }
    
    const lastCat = categories[categories.length - 1];
    return {
        weight: `${lastCat.weight}+`,
        idealHeight: lastCat.idealHeight
    };
}

// ============================================
// CALCULATIONS MODULE (ОБНОВЛЕННАЯ ЛОГИКА КСР)
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
        
        let potential = 100;
        
        const heightDiff = idealHeight - height;
        if (heightDiff > 0) {
            potential -= heightDiff * 5;
        }
        
        const apeIndex = reach - height;
        if (apeIndex < 0) {
            potential -= Math.abs(apeIndex) * 4;
        }
        
        potential = Math.max(10, potential);
        
        return Math.round(potential);
    },

    // ✅ НОВАЯ ФОРМУЛА КСР (взвешенная сумма 3 категорий)
    calculateRealization(athlete) {
        let physicsScore = 0;
        let functionalScore = 0;
        let technicalScore = 0;
        
        // 1. Физика (33.3%)
        if (athlete.tests && athlete.tests.physical) {
            const physicalTests = Object.values(athlete.tests.physical);
            if (physicalTests.length > 0) {
                const avgPhysics = physicalTests.reduce((sum, test) => sum + (test.normalizedScore || 0), 0) / physicalTests.length;
                physicsScore = avgPhysics * 0.333;
            }
        }
        
        // 2. Функционал (33.3%)
        if (athlete.tests && athlete.tests.functional) {
            const functionalTests = Object.values(athlete.tests.functional);
            if (functionalTests.length > 0) {
                const avgFunctional = functionalTests.reduce((sum, test) => sum + (test.normalizedScore || 0), 0) / functionalTests.length;
                functionalScore = avgFunctional * 0.333;
            }
        }
        
        // 3. Техника (33.3%)
        if (athlete.technicalScore && typeof athlete.technicalScore === 'number') {
            // Преобразуем из шкалы 1-5 в 0-100, затем берем 33.3%
            technicalScore = ((athlete.technicalScore / 5) * 100) * 0.333;
        }
        
        const totalScore = physicsScore + functionalScore + technicalScore;
        
        // Если все три категории пустые, возвращаем "Нет данных"
        if (totalScore === 0) {
            return "Нет данных";
        }
        
        return Math.round(totalScore);
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
    }
};

// ============================================
// RECOMMENDATIONS MODULE
// ============================================
const Recommendations = {
    generate(athlete) {
        const recommendations = [];
        const metrics = athlete.metrics || {};
        const gap = metrics.gap;

        if (gap === "Нет данных" || gap === undefined || typeof gap !== 'number') {
            return recommendations;
        }

        if (gap > 20) {
            recommendations.push({
                type: 'critical',
                title: 'Большой разрыв между потенциалом и реализацией',
                text: `Разрыв составляет ${gap} баллов. Необходимо усилить практическую работу.`
            });
        } else if (gap > 10) {
            recommendations.push({
                type: 'warning',
                title: 'Есть резервы для роста',
                text: `Разрыв ${gap} баллов указывает на нереализованный потенциал.`
            });
        } else if (gap >= 0 && gap <= 5) {
            recommendations.push({
                type: 'success',
                title: 'Отличная реализация потенциала',
                text: 'Спортсмен работает на пределе возможностей.'
            });
        }

        return recommendations;
    }
};

// ============================================
// AUTH MODULE
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
// ATHLETES MODULE
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
            tests: {
                physical: {},
                functional: {}
            },
            technicalScore: null,
            psychologicalProfile: null,
            metrics: { potential: 0, realization: "Нет данных", gap: "Нет данных" },
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

    async submitTest(athleteId, category, testId, result, norm) {
        const athlete = await Storage.getAthleteById(athleteId);
        if (!athlete) return false;
        
        const evaluation = TestEvaluator.evaluateTest(result, norm);
        
        const testData = {
            result: result,
            date: Utils.getCurrentDate(),
            status: evaluation.status,
            normalizedScore: evaluation.normalizedScore,
            color: evaluation.color
        };
        
        const tests = athlete.tests || { physical: {}, functional: {} };
        if (!tests[category]) tests[category] = {};
        tests[category][testId] = testData;
        
        await Storage.updateAthlete(athleteId, { tests });
        await Calculations.updateAthleteMetrics(athleteId);
        
        return true;
    },

    async setTechnicalScore(athleteId, score) {
        await Storage.updateAthlete(athleteId, { technicalScore: score });
        await Calculations.updateAthleteMetrics(athleteId);
        return true;
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
        
        const potential = Calculations.calculatePotential(athlete);
        const realization = Calculations.calculateRealization(athlete);
        const gap = Calculations.calculateGap(potential, realization);
        
        return {
            id: athlete.id,
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            birthYear: athlete.birthYear,
            gender: athlete.gender,
            metrics: { potential, realization, gap },
            anthropometry: athlete.anthropometry,
            tests: athlete.tests,
            technicalScore: athlete.technicalScore,
            psychologicalProfile: athlete.psychologicalProfile
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
// ROUTER MODULE
// ============================================
const Router = {
    currentPage: null,
    currentAthleteId: null,
    authInitialized: false,

    init() {
        auth.onAuthStateChanged(user => {
            console.log('Auth state changed:', user ? user.email : 'No user');
            
            if (!this.authInitialized) {
                this.authInitialized = true;
                this.setupAuthHandlers();
                window.addEventListener('hashchange', () => this.route());
            }
            
            const { page } = Utils.getHashParams();
            
            if (user) {
                if (!page || page === 'auth') {
                    this.navigate('dashboard');
                } else {
                    this.route();
                }
            } else {
                if (page === 'student') {
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
        // Реализация для студенческой страницы
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
            
            for (const athlete of athletes) {
                const potential = Calculations.calculatePotential(athlete);
                const realization = Calculations.calculateRealization(athlete);
                const gap = Calculations.calculateGap(potential, realization);
                const weightCategory = Calculations.getWeightCategory(athlete);
                
                const card = document.createElement('div');
                card.className = 'athlete-card';
                const genderText = athlete.gender === 'M' ? 'М' : 'Ж';
                
                const realizationDisplay = realization === "Нет данных" ? "Нет данных" : `${realization}%`;
                const gapDisplay = gap === "Нет данных" ? "Нет данных" : gap;
                const weightCategoryDisplay = weightCategory || 'Нет данных';
                
                card.innerHTML = `
                    <div class="athlete-info">
                        <h3>${athlete.firstName} ${athlete.lastName}</h3>
                        <p class="athlete-meta">${athlete.birthYear} г.р., ${genderText} | Категория: ${weightCategoryDisplay}</p>
                    </div>
                    <div class="athlete-metrics">
                        <div class="metric"><span class="metric-label">Потенциал</span><span class="metric-value">${potential}%</span></div>
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
    },

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
                this.navigate('profile', { id: athleteId });
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

        const potential = Calculations.calculatePotential(athlete);
        const realization = Calculations.calculateRealization(athlete);
        const gap = Calculations.calculateGap(potential, realization);
        
        const realizationDisplay = realization === "Нет данных" ? "Нет данных" : `${realization}%`;
        const gapDisplay = gap === "Нет данных" ? "Нет данных" : gap;

        document.getElementById('profile-potential').textContent = `${potential}%`;
        document.getElementById('profile-realization').textContent = realizationDisplay;
        document.getElementById('profile-gap').textContent = gapDisplay;

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
            recommendationsDiv.innerHTML = '<p>Для формирования рекомендаций необходимо внести данные по тестам</p>';
        }

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
