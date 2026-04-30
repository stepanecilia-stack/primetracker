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
// SKILLS DATA (БЕЗ ИЗМЕНЕНИЙ)
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
        const age = Utils.calculateAge(athlete.birthYear);
        const gender = athlete.gender;
        let score = 0;

        const reachRatio = reach / height;
        if (reachRatio >= 1.05 && reachRatio <= 1.10) score += 30;
        else if (reachRatio >= 1.0 && reachRatio < 1.05) score += 25;
        else if (reachRatio > 1.10 && reachRatio <= 1.15) score += 25;
        else score += 15;

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

        if (age >= 10 && age <= 14) score += 20;
        else if (age >= 15 && age <= 17) score += 25;
        else if (age >= 18 && age <= 25) score += 20;
        else if (age >= 26 && age <= 30) score += 15;
        else score += 10;

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
            let errorMsg = 'Ошибка входа';
            if (error.code === 'auth/user-not-found') {
                errorMsg = 'Пользователь не найден';
            } else if (error.code === 'auth/wrong-password') {
                errorMsg = 'Неверный пароль';
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
        
        const birthYear = Number(new Date(data.birthDate).getFullYear());
        
        const athlete = {
            coachId: auth.currentUser.uid,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            birthDate: data.birthDate,
            birthYear: birthYear,
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

    init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                const { page } = Utils.getHashParams();
                if (!page || page === 'auth') {
                    this.navigate('dashboard');
                } else {
                    this.route();
                }
            } else {
                this.navigate('auth');
            }
        });

        this.setupAuthHandlers();
        window.addEventListener('hashchange', () => this.route());
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
            targetPage = 'auth';
        } else if (targetPage === '' || targetPage === 'auth') {
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
                this.navigate('dashboard');
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
            
            athletes.forEach(athlete => {
                const card = document.createElement('div');
                card.className = 'athlete-card';
                const metrics = athlete.metrics || { potential: 0, realization: 0, gap: 0 };
                const genderText = athlete.gender === 'M' ? 'М' : 'Ж';
                
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
        document.getElementById('btn-logout').onclick = async () => {
            if (confirm('Вы уверены, что хотите выйти?')) {
                await AuthModule.logout();
            }
        };
        
        Utils.hideLoader();
    },

    form.onsubmit = async (e) => {
    e.preventDefault();
    
    // Валидация года рождения
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
        const profile = await Athletes.getProfile(athleteId);
        Utils.hideLoader();

        if (!profile) {
            alert('Спортсмен не найден');
            this.navigate('dashboard');
            return;
        }

        const genderText = profile.gender === 'M' ? 'М' : 'Ж';
        document.getElementById('profile-athlete-name').textContent = `${profile.firstName} ${profile.lastName}`;
        document.getElementById('profile-athlete-meta').textContent = `${profile.birthYear} г.р., ${genderText}`;

        const metrics = profile.metrics || {};
        document.getElementById('profile-potential').textContent = metrics.potential || '—';
        document.getElementById('profile-realization').textContent = metrics.realization || '—';
        document.getElementById('profile-gap').textContent = metrics.gap || '—';

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
                // ДИНАМИЧЕСКАЯ ГЕНЕРАЦИЯ КНОПОК С ID
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
// BOXING BENCHMARKS DATABASE
// ============================================
const BOXING_BENCHMARKS = {
    M: { // Мужчины
        '13-14': [
            { weight: 37, idealHeight: 153, archetype: 'Жилистый, «сухие» длинные мышцы.' },
            { weight: 40, idealHeight: 156, archetype: 'Жилистый, «сухие» длинные мышцы.' },
            { weight: 42, idealHeight: 158, archetype: 'Легкий атлет, акцент на скорость и прыжок.' },
            { weight: 44, idealHeight: 161, archetype: 'Сбалансированный, начинает оформляться плечевой пояс.' },
            { weight: 46, idealHeight: 164, archetype: 'Эталон. Оптимальное сочетание рычага и плотности.' },
            { weight: 48, idealHeight: 167, archetype: 'Снайпер. Длинные руки, высокая мобильность.' },
            { weight: 50, idealHeight: 170, archetype: 'Атлетичный. Появляется мощь в ударе за счет спины.' },
            { weight: 52, idealHeight: 172, archetype: 'Плотный. Хорошо развиты широчайшие и дельты.' },
            { weight: 54, idealHeight: 174, archetype: 'Универсал. Мощный торс при сохранении роста.' },
            { weight: 57, idealHeight: 176, archetype: 'Силовик-темповик. «Мясо» на груди и мощные ноги.' },
            { weight: 60, idealHeight: 178, archetype: 'Пик функционала. Максимальная плотность удара.' },
            { weight: 63, idealHeight: 181, archetype: 'Крупный атлет. Рост взрослого, сила подростка.' },
            { weight: 66, idealHeight: 183, archetype: 'Мощный каркас. Доминирование за счет физики.' },
            { weight: 70, idealHeight: 185, archetype: 'Тяжелоатлетическое сложение. Взрывной прыжок.' },
            { weight: 75, idealHeight: 188, archetype: 'Гигант с мышечной базой. Редкий, элитный профиль.' },
            { weight: 80, idealHeight: 191, archetype: 'Будущий супертяж. Огромный размах рук.' },
            { weight: 90, idealHeight: 194, archetype: 'Абсолютное доминирование. Мощь + Рост.' }
        ],
        '15-16': [
            { weight: 44, idealHeight: 160, archetype: 'Очень сухой, «звенящий» атлет. Предел весогонки.' },
            { weight: 46, idealHeight: 162, archetype: 'Очень сухой, «звенящий» атлет. Предел весогонки.' },
            { weight: 48, idealHeight: 164, archetype: 'Снайпер-легкач. Высокая скорость рук.' },
            { weight: 50, idealHeight: 167, archetype: 'Оформленный атлет. Появляется жесткость в кости.' },
            { weight: 52, idealHeight: 170, archetype: 'Баланс. Плечи шире таза, сухая талия.' },
            { weight: 54, idealHeight: 172, archetype: 'Плотный «игровик». Мощные ноги для челнока.' },
            { weight: 57, idealHeight: 175, archetype: 'Золотая середина. Идеальный рычаг для этого веса.' },
            { weight: 60, idealHeight: 177, archetype: 'Универсал. Мышцы спины и груди уже отчетливы.' },
            { weight: 63, idealHeight: 179, archetype: 'Силовик. Тяжелый, акцентированный удар.' },
            { weight: 66, idealHeight: 181, archetype: 'Атлет с глубоким рельефом. Мощный плечевой пояс.' },
            { weight: 70, idealHeight: 183, archetype: 'Крупный, сбитый боец. Доминирует за счет массы.' },
            { weight: 75, idealHeight: 186, archetype: 'Полутяж. Рост взрослого профи, мощный костяк.' },
            { weight: 80, idealHeight: 189, archetype: 'Тяжеловес. Огромная физическая мощь + ГТО золото.' },
            { weight: 90, idealHeight: 192, archetype: 'Абсолютка. Массивный скелет, готовый к большим весам.' }
        ],
        '17-18': [
            { weight: 48, idealHeight: 162, archetype: 'Предельно сухой «мухач». Только жилы и кости.' },
            { weight: 51, idealHeight: 165, archetype: 'Скоростной снайпер. Феноменальная резкость.' },
            { weight: 54, idealHeight: 168, archetype: 'Техничный «игровик». Идеальный баланс рычагов.' },
            { weight: 57, idealHeight: 171, archetype: 'Оформленный атлет. Плотный удар, широкие плечи.' },
            { weight: 60, idealHeight: 174, archetype: 'Классика. Образцовый боксерский силуэт.' },
            { weight: 63.5, idealHeight: 176, archetype: 'Темповик. Мощный торс, готовый к высокой плотности боя.' },
            { weight: 67, idealHeight: 178, archetype: 'Силовик. Жесткая кость, тяжелый кулак.' },
            { weight: 71, idealHeight: 181, archetype: 'Твой типаж. Идеальный рычаг + мужская мощь.' },
            { weight: 75, idealHeight: 183, archetype: 'Мощный средневес. Доминирование за счет физики.' },
            { weight: 80, idealHeight: 186, archetype: 'Полутяж. Сбитый, атлетичный, очень опасный.' },
            { weight: 86, idealHeight: 189, archetype: 'Тяжеловес-атлет. Глубокий рельеф, мощная спина.' },
            { weight: 92, idealHeight: 192, archetype: 'Крузер. Огромная мощь при сохранении мобильности.' },
            { weight: 100, idealHeight: 195, archetype: 'Супертяж. Массивный костяк, готовый нести 100+ кг.' }
        ],
        '19-22': [
            { weight: 48, idealHeight: 162, archetype: 'Сухой, жилистый «мухач».' },
            { weight: 51, idealHeight: 165, archetype: 'Скоростной снайпер.' },
            { weight: 54, idealHeight: 168, archetype: 'Техничный игровик.' },
            { weight: 57, idealHeight: 171, archetype: 'Сбалансированный полулегковес.' },
            { weight: 60, idealHeight: 174, archetype: 'Классический боксерский силуэт.' },
            { weight: 63.5, idealHeight: 176, archetype: 'Мощный темповик.' },
            { weight: 67, idealHeight: 178, archetype: 'Силовик с тяжелым ударом.' },
            { weight: 71, idealHeight: 181, archetype: 'Твой эталон. Идеальный баланс рычага и мощи.' },
            { weight: 75, idealHeight: 183, archetype: 'Мощный средневес.' },
            { weight: 80, idealHeight: 186, archetype: 'Атлетичный полутяж.' },
            { weight: 86, idealHeight: 189, archetype: 'Тяжеловес-атлет.' },
            { weight: 92, idealHeight: 192, archetype: 'Крузер с огромным размахом.' },
            { weight: 100, idealHeight: 195, archetype: 'Супертяж-гигант.' }
        ]
    },
    F: { // Женщины
        '13-14': [
            { weight: 34, idealHeight: 158, archetype: 'Дистанция. Недосягаемость для атак, работа передней рукой.' },
            { weight: 36, idealHeight: 161, archetype: 'Дистанция. Недосягаемость для атак, работа передней рукой.' },
            { weight: 38, idealHeight: 163, archetype: 'Рычаг. Контроль центра ринга за счет длины рук.' },
            { weight: 40, idealHeight: 165, archetype: 'Тайминг. Встречные удары на входе соперницы в зону.' },
            { weight: 42, idealHeight: 167, archetype: 'Маневренность. Удержание дальней дистанции весь бой.' },
            { weight: 44, idealHeight: 169, archetype: 'Геометрия. Удары под углами, которые недоступны низким.' },
            { weight: 46, idealHeight: 170, archetype: 'Доминирование. Полный контроль пространства ринга.' },
            { weight: 48, idealHeight: 172, archetype: 'Прессинг. Расстрел с дистанции без входа в клинч.' },
            { weight: 51, idealHeight: 174, archetype: 'Функционал. Сочетание длины шага и частоты ударов.' },
            { weight: 54, idealHeight: 176, archetype: 'Резкость. Длинный «хлесткий» джеб, сбивающий атаки.' },
            { weight: 57, idealHeight: 178, archetype: 'Атлетизм. Использование рычага как рычага силы.' },
            { weight: 60, idealHeight: 180, archetype: 'Психология. Подавление ростом и объемом атак.' },
            { weight: 64, idealHeight: 183, archetype: 'Точность. Работа как «высокий снайпер» по этажам.' },
            { weight: 70, idealHeight: 185, archetype: 'Тотальный контроль. Соперницы просто не дотягиваются.' }
        ],
        '15-16': [
            { weight: 44, idealHeight: 166, archetype: 'Скорость. Максимальный рычаг при сохранении резкости.' },
            { weight: 46, idealHeight: 168, archetype: 'Скорость. Максимальный рычаг при сохранении резкости.' },
            { weight: 48, idealHeight: 169, archetype: 'Тайминг. Работа на опережение, контроль дистанции.' },
            { weight: 50, idealHeight: 171, archetype: 'Линейность. Прямые удары, которые длиннее атак соперниц.' },
            { weight: 52, idealHeight: 172, archetype: 'Баланс. Устойчивость в ногах + длинный джеб.' },
            { weight: 54, idealHeight: 173, archetype: 'Жесткость. Появляется «взрыв» в ударе за счет спины.' },
            { weight: 57, idealHeight: 174, archetype: 'Универсализм. Одинаково эффективна на дистанции и в отходе.' },
            { weight: 60, idealHeight: 175, archetype: 'Плотность. Мышцы плечевого пояса позволяют «рубиться».' },
            { weight: 63, idealHeight: 176, archetype: 'Сила. Акцентированные удары, сбивающие защиту.' },
            { weight: 66, idealHeight: 177, archetype: 'Прессинг. Подавление физикой при сохранении роста.' },
            { weight: 70, idealHeight: 178, archetype: 'Мощь. Тяжелый удар, работа по корпусу.' },
            { weight: 75, idealHeight: 180, archetype: 'Доминирование. Сочетание массы и высокого роста.' },
            { weight: 80, idealHeight: 182, archetype: 'Атлетизм. Мощный костяк, готовый к тяжелым разменам.' },
            { weight: 90, idealHeight: 185, archetype: 'Абсолютка. Физическое превосходство во всем.' }
        ],
        '17-18': [
            { weight: 48, idealHeight: 164, archetype: 'Резкость. Предельная концентрация силы в сухом теле.' },
            { weight: 50, idealHeight: 168, archetype: 'Линейная скорость. Быстрый вход-выход на длинных ногах.' },
            { weight: 52, idealHeight: 170, archetype: 'Контр-атака. Проваливание соперницы и расстрел с дистанции.' },
            { weight: 54, idealHeight: 171, archetype: 'Техничность. Идеальная координация рычагов и корпуса.' },
            { weight: 57, idealHeight: 172, archetype: 'Жесткий джеб. Остановка любых атак передней рукой.' },
            { weight: 60, idealHeight: 173, archetype: 'Универсальность. Работа на всех дистанциях за счет атлетизма.' },
            { weight: 63, idealHeight: 174, archetype: 'Плотный бой. Силовое доминирование в разменах.' },
            { weight: 66, idealHeight: 175, archetype: 'Устойчивость. Мощный фундамент (ноги) + длинный удар.' },
            { weight: 70, idealHeight: 176, archetype: 'Акцент. Тяжелый, «мужской» по силе удар.' },
            { weight: 75, idealHeight: 178, archetype: 'Физика. Подавление массой при сохранении роста.' },
            { weight: 81, idealHeight: 180, archetype: 'Мощь. Доминирование за счет объема мышц и рычага.' },
            { weight: 90, idealHeight: 183, archetype: 'Абсолютка. Максимальный костяк и ударная мощь.' }
        ],
        '19-22': [
            { weight: 48, idealHeight: 164, archetype: 'Скорость и рычаг. Работа на дистанции, недосягаемость.' },
            { weight: 50, idealHeight: 168, archetype: 'Тайминг. Встречные удары, контроль передней рукой.' },
            { weight: 52, idealHeight: 170, archetype: 'Линейная мощь. Длинные прямые, пробивающие защиту.' },
            { weight: 54, idealHeight: 171, archetype: 'Баланс. Идеальное сочетание устойчивости и длины рук.' },
            { weight: 57, idealHeight: 172, archetype: 'Жесткость. Остановка атак за счет плотности удара.' },
            { weight: 60, idealHeight: 173, archetype: 'Универсализм. Доминирование на всех дистанциях.' },
            { weight: 63, idealHeight: 174, archetype: 'Силовой прессинг. Подавление физикой и рычагом.' },
            { weight: 66, idealHeight: 175, archetype: 'Устойчивость. Мощные ноги (база ГТО) + длинный удар.' },
            { weight: 70, idealHeight: 176, archetype: 'Акцент. Тяжелый удар, работа по этажам.' },
            { weight: 75, idealHeight: 178, archetype: 'Атлетизм. Мощный плечевой пояс, доминирование в клинче.' },
            { weight: 81, idealHeight: 180, archetype: 'Физическая мощь. Подавление массой и ростом.' },
            { weight: 90, idealHeight: 183, archetype: 'Абсолютка. Максимальный костяк, сокрушительный удар.' }
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
    let closest = categories[0];
    let minDiff = Math.abs(weight - closest.weight);
    
    for (let cat of categories) {
        const diff = Math.abs(weight - cat.weight);
        if (diff < minDiff) {
            minDiff = diff;
            closest = cat;
        }
    }
    
    return closest;
}

function calculateBiometricPotential(height, reach, idealHeight) {
    const apeIndex = reach - height;
    const baseCoeff = height / idealHeight;
    const leverBonus = (apeIndex / 10) * 0.05;
    const potential = (baseCoeff + leverBonus) * 100;
    return Math.round(potential * 10) / 10;
}

function getArchetype(height, idealHeight, weight, gender, ageGroup) {
    const deviation = height - idealHeight;
    
    if (Math.abs(deviation) <= 3) {
        return {
            icon: '🟢',
            name: 'Биометрический Доминант',
            description: 'Идеальное соответствие роста и веса. Максимальный потенциал для категории.'
        };
    }
    
    if (deviation >= -7 && deviation < -3) {
        return {
            icon: '🟡',
            name: 'Технический Мастер',
            description: 'Компактное сложение. Преимущество в скорости и маневренности.'
        };
    }
    
    if (deviation < -7) {
        const categories = BOXING_BENCHMARKS[gender][ageGroup];
        const currentIndex = categories.findIndex(c => Math.abs(c.weight - weight) < 2);
        
        if (currentIndex === 0) {
            return {
                icon: '🔴',
                name: 'Компенсатор (Тип Б: Реактивный Штурмовик)',
                description: 'Минимальный вес для возраста. Компенсация недостатка роста агрессией и плотностью боя.'
            };
        } else {
            return {
                icon: '🔴',
                name: 'Компенсатор (Тип А: Инфайтер-Танк)',
                description: 'Низкий рост для веса. Работа на ближней дистанции, давление корпусом.'
            };
        }
    }
    
    return {
        icon: '⚪',
        name: 'Нестандартный профиль',
        description: 'Требуется индивидуальный подход.'
    };
}

function calculateKSR(athleteSkills, potential) {
    if (!athleteSkills || potential === 0) return null;
    
    let atomsSum = 0, atomsCount = 0;
    let ofpSum = 0, ofpCount = 0;
    
    // Атомы (техника + защита + тактика)
    ['technique', 'defense', 'tactics'].forEach(cat => {
        if (athleteSkills[cat]) {
            Object.values(athleteSkills[cat]).forEach(rating => {
                atomsSum += rating;
                atomsCount++;
            });
        }
    });
    
    // ОФП (физические качества)
    if (athleteSkills.physical) {
        Object.values(athleteSkills.physical).forEach(rating => {
            ofpSum += rating;
            ofpCount++;
        });
    }
    
    if (atomsCount === 0 || ofpCount === 0) return null;
    
    const avgAtoms = atomsSum / atomsCount;
    const avgOFP = ofpSum / ofpCount;
    const ksr = (avgAtoms + avgOFP) / (2 * (potential / 100));
    
    return Math.round(ksr * 100) / 100;
}

function interpretKSR(ksr) {
    if (ksr === null) return { text: 'Недостаточно данных', class: 'status-gray' };
    if (ksr < 0.8) return { text: 'Недобор мощности', class: 'status-red' };
    if (ksr >= 0.8 && ksr <= 1.2) return { text: 'Оптимальная реализация', class: 'status-green' };
    return { text: 'Сверх-реализация', class: 'status-blue' };
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    Router.init();
    
});
