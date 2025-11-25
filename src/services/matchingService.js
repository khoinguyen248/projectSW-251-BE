// New file: src/services/matchingService.js
class MatchingService {
  constructor() {
    this.weights = {
      subjectMatch: 0.4,
      scheduleMatch: 0.3,
      ratingScore: 0.2,
      experienceMatch: 0.1
    };
  }

  // Core matching algorithm
  async findBestMatches(studentProfile, tutors, preferences = {}) {
    const scoredTutors = tutors.map(tutor => {
      const score = this.calculateMatchScore(studentProfile, tutor, preferences);
      return { ...tutor, matchScore: score, matchPercentage: Math.round(score * 100) };
    });

    // Sort by match score (descending)
    return scoredTutors.sort((a, b) => b.matchScore - a.matchScore);
  }

  calculateMatchScore(student, tutor, preferences) {
    let totalScore = 0;

    // 1. Subject matching (40%)
    const subjectScore = this.calculateSubjectMatch(student.learningGoals, tutor.subjectSpecialty);
    totalScore += subjectScore * this.weights.subjectMatch;

    // 2. Schedule compatibility (30%)
    const scheduleScore = this.calculateScheduleMatch(student.availability, tutor.availability);
    totalScore += scheduleScore * this.weights.scheduleMatch;

    // 3. Rating and reputation (20%)
    const ratingScore = this.calculateRatingScore(tutor.ratingAvg, tutor.totalRatings);
    totalScore += ratingScore * this.weights.ratingScore;

    // 4. Experience level matching (10%)
    const experienceScore = this.calculateExperienceMatch(student.level, tutor.experienceYears);
    totalScore += experienceScore * this.weights.experienceMatch;

    return Math.min(totalScore, 1.0); // Normalize to 0-1
  }

  calculateSubjectMatch(studentGoals, tutorSpecialties) {
    if (!studentGoals || !tutorSpecialties) return 0;
    
    const matches = studentGoals.filter(goal => 
      tutorSpecialties.some(specialty => 
        specialty.toLowerCase().includes(goal.toLowerCase()) ||
        goal.toLowerCase().includes(specialty.toLowerCase())
      )
    );
    
    return matches.length / Math.max(studentGoals.length, 1);
  }

  calculateScheduleMatch(studentAvailability, tutorAvailability) {
    // Simple overlap calculation - can be enhanced with actual time slot matching
    if (!studentAvailability || !tutorAvailability) return 0.5;
    
    const studentSlots = studentAvailability.length;
    const tutorSlots = tutorAvailability.length;
    const minSlots = Math.min(studentSlots, tutorSlots);
    
    return minSlots / Math.max(studentSlots, 1);
  }

  calculateRatingScore(rating, totalRatings) {
    if (!rating || totalRatings === 0) return 0.5; // Default for new tutors
    
    // Boost score for highly-rated tutors with significant reviews
    const baseScore = rating / 5;
    const confidence = Math.min(totalRatings / 10, 1); // More ratings = more confidence
    
    return baseScore * 0.7 + confidence * 0.3;
  }

  calculateExperienceMatch(studentLevel, tutorExperience) {
    const levelWeights = {
      'beginner': 1,
      'intermediate': 2, 
      'advanced': 3
    };
    
    const studentWeight = levelWeights[studentLevel] || 1;
    const idealExperience = studentWeight * 2; // Beginner: 2 years, Advanced: 6 years
    
    if (!tutorExperience) return 0.5;
    
    const diff = Math.abs(tutorExperience - idealExperience);
    return Math.max(0, 1 - (diff / 10)); // Normalize
  }
}

export default new MatchingService();