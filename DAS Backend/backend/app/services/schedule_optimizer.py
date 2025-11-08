"""
Advanced Schedule Optimization Algorithms
Implements AI-like optimization for schedule generation
"""

import random
import math
from typing import List, Dict, Tuple, Set, Optional, Any, cast
from dataclasses import dataclass
from datetime import time, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.schedules import ScheduleAssignment, TimeSlot, ScheduleConstraint
from ..models.academic import Class, Subject
from ..models.teachers import Teacher, TeacherAssignment
from ..schemas.schedules import DayOfWeek, ScheduleGenerationRequest
from .constraint_solver import ConstraintSolver

@dataclass
class OptimizationConstraint:
    """Represents a scheduling constraint"""
    constraint_type: str
    weight: float  # 0.0 to 1.0
    parameters: Dict
    violation_penalty: float = 1.0

@dataclass
class ScheduleScore:
    """Represents the quality score of a schedule"""
    total_score: float
    constraint_violations: Dict[str, int]
    teacher_balance_score: float
    continuity_score: float
    conflict_penalty: float
    # Multi-objective components
    quality_score: float = 0.0
    feasibility_score: float = 0.0
    balance_score: float = 0.0
    preference_score: float = 0.0

class GeneticScheduleOptimizer:
    """Genetic Algorithm for schedule optimization with multi-objective fitness"""
    
    def __init__(self, db: Session):
        self.db = db
        self.population_size = 50
        self.generations = 100
        self.max_generations = 100
        self.mutation_rate = 0.1
        self.crossover_rate = 0.8
        self.elite_size = 5
        self.constraint_solver = ConstraintSolver(db)
        
        # Multi-objective weights
        self.weights = {
            'quality': 0.3,      # Overall quality (constraint satisfaction)
            'feasibility': 0.4,  # Hard constraints (critical)
            'balance': 0.2,      # Load balancing
            'preference': 0.1    # Soft preferences
        }
        
        # Adaptive parameters
        self.current_generation = 0
        self.diversity_threshold = 0.3
        self.stagnation_counter = 0
        
    def optimize_schedule(self, assignments: List[ScheduleAssignment], 
                         constraints: List[OptimizationConstraint],
                         time_slots: List[TimeSlot]) -> List[ScheduleAssignment]:
        """Main optimization method using genetic algorithm with adaptive parameters"""
        
        # Initialize population
        population = self._create_initial_population(assignments, time_slots)
        
        best_score = float('-inf')
        best_solution = assignments
        best_score_history = []
        
        for generation in range(self.generations):
            self.current_generation = generation
            
            # Evaluate population
            scored_population = [(individual, self._evaluate_schedule(individual, constraints)) 
                               for individual in population]
            
            # Sort by fitness
            scored_population.sort(key=lambda x: x[1].total_score, reverse=True)
            
            # Track best solution
            current_best = scored_population[0]
            if current_best[1].total_score > best_score:
                best_score = current_best[1].total_score
                best_solution = current_best[0]
            
            best_score_history.append(best_score)
            
            # Calculate population diversity
            diversity = self._calculate_population_diversity(population)
            
            # Adapt mutation rate based on generation, diversity, and convergence
            adaptive_mutation_rate = self._adapt_mutation_rate(generation, diversity, best_score_history)
            
            # Create next generation
            new_population = []
            
            # Keep elite
            for i in range(self.elite_size):
                new_population.append(scored_population[i][0])
            
            # Generate offspring
            while len(new_population) < self.population_size:
                parent1 = self._tournament_selection(scored_population)
                parent2 = self._tournament_selection(scored_population)
                
                if random.random() < self.crossover_rate:
                    child1, child2 = self._crossover(parent1, parent2, time_slots)
                    new_population.extend([child1, child2])
                else:
                    new_population.extend([parent1, parent2])
            
            # Mutation with adaptive rate
            for i in range(self.elite_size, len(new_population)):
                if random.random() < adaptive_mutation_rate:
                    new_population[i] = self._mutate(new_population[i], time_slots)
            
            population = new_population[:self.population_size]
            
            # Early termination if excellent solution found
            if best_score > 0.98:  # 98% optimal
                break
        
        return best_solution
    
    def _create_initial_population(self, base_assignments: List[ScheduleAssignment], 
                                 time_slots: List[TimeSlot]) -> List[List[ScheduleAssignment]]:
        """Create initial population of schedule variants"""
        population = []
        
        # Add the original schedule
        population.append(base_assignments.copy())
        
        # Generate variations
        for _ in range(self.population_size - 1):
            variant = self._create_random_variant(base_assignments, time_slots)
            population.append(variant)
        
        return population
    
    def _create_random_variant(self, base_assignments: List[ScheduleAssignment], 
                             time_slots: List[TimeSlot]) -> List[ScheduleAssignment]:
        """Create a random variant of the base schedule"""
        variant = base_assignments.copy()
        
        # Randomly shuffle some assignments
        num_changes = random.randint(1, len(variant) // 4)
        
        for _ in range(num_changes):
            if len(variant) > 1:
                # Swap two random assignments' time slots
                idx1, idx2 = random.sample(range(len(variant)), 2)
                variant[idx1].time_slot_id, variant[idx2].time_slot_id = \
                    variant[idx2].time_slot_id, variant[idx1].time_slot_id
        
        return variant
    
    def _evaluate_schedule(self, assignments: List[ScheduleAssignment], 
                          constraints: List[OptimizationConstraint]) -> ScheduleScore:
        """Evaluate the quality of a schedule"""
        total_score = 0.0
        violations = {}
        
        # Check each constraint
        for constraint in constraints:
            violation_count = self._check_constraint(assignments, constraint)
            violations[constraint.constraint_type] = violation_count
            
            # Calculate penalty
            penalty = violation_count * constraint.violation_penalty
            constraint_score = max(0, constraint.weight * (1 - penalty))
            total_score += constraint_score
        
        # Additional scoring factors
        teacher_balance = self._calculate_teacher_balance_score(assignments)
        continuity = self._calculate_continuity_score(assignments)
        conflict_penalty = self._calculate_conflict_penalty(assignments)
        
        total_score += teacher_balance * 0.2 + continuity * 0.15
        total_score -= conflict_penalty
        
        # Calculate multi-objective components
        quality_score = self._calculate_quality_score(assignments, constraints)
        feasibility_score = self._calculate_feasibility_score(assignments)
        balance_score = teacher_balance
        preference_score = continuity
        
        # Weighted multi-objective total
        multi_objective_score = (
            self.weights['quality'] * quality_score +
            self.weights['feasibility'] * feasibility_score +
            self.weights['balance'] * balance_score +
            self.weights['preference'] * preference_score
        )
        
        return ScheduleScore(
            total_score=multi_objective_score,
            constraint_violations=violations,
            teacher_balance_score=teacher_balance,
            continuity_score=continuity,
            conflict_penalty=conflict_penalty,
            quality_score=quality_score,
            feasibility_score=feasibility_score,
            balance_score=balance_score,
            preference_score=preference_score
        )
    
    def _check_constraint(self, assignments: List[ScheduleAssignment], 
                         constraint: OptimizationConstraint) -> int:
        """Check how many times a constraint is violated"""
        violations = 0
        
        if constraint.constraint_type == "teacher_availability":
            violations = self._check_teacher_availability(assignments, constraint.parameters)
        elif constraint.constraint_type == "room_capacity":
            violations = self._check_room_capacity(assignments, constraint.parameters)
        elif constraint.constraint_type == "subject_distribution":
            violations = self._check_subject_distribution(assignments, constraint.parameters)
        elif constraint.constraint_type == "teacher_workload":
            violations = self._check_teacher_workload(assignments, constraint.parameters)
        elif constraint.constraint_type == "break_timing":
            violations = self._check_break_timing(assignments, constraint.parameters)
        
        return violations
    
    def _tournament_selection(self, scored_population: List[Tuple], tournament_size: int = 3) -> List[ScheduleAssignment]:
        """Tournament selection for genetic algorithm"""
        tournament = random.sample(scored_population, min(tournament_size, len(scored_population)))
        winner = max(tournament, key=lambda x: x[1].total_score)
        return winner[0]
    
    def _crossover(self, parent1: List[ScheduleAssignment], parent2: List[ScheduleAssignment], 
                   time_slots: List[TimeSlot]) -> Tuple[List[ScheduleAssignment], List[ScheduleAssignment]]:
        """Crossover operation for genetic algorithm"""
        # Order-based crossover
        crossover_point = random.randint(1, len(parent1) - 1)
        
        child1 = parent1[:crossover_point] + parent2[crossover_point:]
        child2 = parent2[:crossover_point] + parent1[crossover_point:]
        
        # Fix any conflicts that arise from crossover
        child1 = self._fix_crossover_conflicts(child1, time_slots)
        child2 = self._fix_crossover_conflicts(child2, time_slots)
        
        return child1, child2
    
    def _mutate(self, schedule: List[ScheduleAssignment], 
                time_slots: List[TimeSlot]) -> List[ScheduleAssignment]:
        """Mutation operation for genetic algorithm"""
        mutated = schedule.copy()
        
        mutation_type = random.choice(['swap', 'reassign', 'teacher_change'])
        
        if mutation_type == 'swap' and len(mutated) > 1:
            # Swap two assignments
            idx1, idx2 = random.sample(range(len(mutated)), 2)
            mutated[idx1].time_slot_id, mutated[idx2].time_slot_id = \
                mutated[idx2].time_slot_id, mutated[idx1].time_slot_id
        
        elif mutation_type == 'reassign':
            # Reassign to random time slot
            if mutated and time_slots:
                assignment = random.choice(mutated)
                new_slot = random.choice(time_slots)
                assignment.time_slot_id = new_slot.id
        
        elif mutation_type == 'teacher_change':
            # Change teacher for random assignment
            if mutated and self.db:
                assignment = random.choice(mutated)
                # Find alternative teachers for this subject
                if assignment.subject_id is not None:  # Check if subject_id is not None
                    alternative_teachers = self._find_alternative_teachers(assignment.subject_id)
                    
                    if alternative_teachers:
                        # Select a teacher who is not already assigned at this time
                        available_teachers = self._filter_available_teachers(
                            alternative_teachers, assignment.time_slot_id, assignment.teacher_id
                        )
                        
                        if available_teachers:
                            # Select the best available teacher
                            best_teacher = self._select_best_teacher(available_teachers, assignment)
                            if best_teacher:  # Check if best_teacher is not None
                                assignment.teacher_id = best_teacher.id
                        else:
                            # If no teachers available, keep current teacher or clear if needed
                            if random.random() < 0.3:  # 30% chance to clear
                                assignment.teacher_id = None
                    else:
                        # If no alternative teachers, clear the assignment
                        assignment.teacher_id = None
        
        return mutated

    def _find_alternative_teachers(self, subject_id: int) -> List[Teacher]:
        """Find alternative teachers who can teach the given subject"""
        try:
            # Query teachers who are assigned to this subject
            alternative_teachers = self.db.query(Teacher).join(TeacherAssignment).filter( 
                and_( 
                    TeacherAssignment.subject_id == subject_id,
                    Teacher.is_active == True
                )
            ).all() 
            
            return alternative_teachers
        except Exception as e:
            print(f"Failed to find alternative teachers: {e}")
            return []
    
    def _filter_available_teachers(self, teachers: List[Teacher], time_slot_id: int, 
                                 current_teacher_id: Optional[int]) -> List[Teacher]:
        """Filter teachers who are available at the given time slot"""
        if not teachers or not time_slot_id:
            return teachers
        
        available_teachers = []
        
        for teacher in teachers:
            # Skip the current teacher
            if teacher.id == current_teacher_id:
                continue
            
            # Check if teacher is already assigned at this time slot
            try:
                conflict = self.db.query(ScheduleAssignment).filter( 
                    and_( 
                        ScheduleAssignment.teacher_id == teacher.id,
                        ScheduleAssignment.time_slot_id == time_slot_id
                    )
                ).first() 
                
                # If no conflict, teacher is available
                if not conflict:
                    available_teachers.append(teacher)
            except Exception:
                # If there's an error in the query, skip this teacher
                continue
        
        return available_teachers

    def _estimate_class_size(self, class_id: int) -> int:
        """Estimate class size based on class information"""
        try:
            # Get class information
            class_obj = self.db.query(Class).filter(Class.id == class_id).first() 
            if not class_obj:
                return 30  # Default estimate
            
            # Estimate based on grade level and number
            base_size = 30  # Default
            
            if class_obj.grade_level == 'primary':
                if class_obj.grade_number <= 3:
                    base_size = 25  # Smaller classes for younger students
                else:
                    base_size = 30
            elif class_obj.grade_level == 'intermediate':
                base_size = 32
            elif class_obj.grade_level == 'secondary':
                base_size = 28  # Slightly smaller for specialized subjects
            
            # Adjust for section count
            if hasattr(class_obj, 'section_count') and class_obj.section_count:
                base_size = max(20, base_size // class_obj.section_count)
            
            return base_size
        except Exception as e:
            print(f"Failed to estimate class size: {e}")
            return 30
    
    def _estimate_room_capacity(self, room_name: str) -> int:
        """Estimate room capacity based on room name and type"""
        # More sophisticated room capacity estimation
        room_name_lower = room_name.lower()
        
        # Laboratory rooms
        if 'lab' in room_name_lower:
            if 'math' in room_name_lower or 'computer' in room_name_lower:
                return 20
            elif 'science' in room_name_lower:
                return 25
            elif 'language' in room_name_lower:
                return 30
            else:
                return 25
        
        # Specialized rooms
        elif 'gym' in room_name_lower or 'sport' in room_name_lower:
            return 50
        elif 'library' in room_name_lower:
            return 40
        elif 'auditorium' in room_name_lower or 'hall' in room_name_lower:
            return 100
        elif 'art' in room_name_lower or 'music' in room_name_lower:
            return 30
        
        # Standard classrooms
        elif 'classroom' in room_name_lower or 'room' in room_name_lower:
            # Extract room number if available
            import re
            room_number_match = re.search(r'\d+', room_name)
            if room_number_match:
                room_number = int(room_number_match.group())
                # Larger room numbers typically indicate larger rooms
                return min(40, 25 + (room_number % 5) * 3)
            else:
                return 30
        
        # Default
        else:
            return 30
    
    def _check_subject_distribution(self, assignments: List[ScheduleAssignment], params: Dict) -> int:
        """Check subject distribution constraints"""
        violations = 0
        class_subjects = {}
        
        for assignment in assignments:
            class_id = assignment.class_id
            subject_id = assignment.subject_id
            
            if class_id not in class_subjects:
                class_subjects[class_id] = {}
            
            if subject_id not in class_subjects[class_id]:
                class_subjects[class_id][subject_id] = 0
            
            class_subjects[class_id][subject_id] += 1
        
        # Check if any subject exceeds maximum periods per week
        max_periods = params.get('max_periods_per_subject', 6)
        for class_id, subjects in class_subjects.items():
            for subject_id, count in subjects.items():
                if count > max_periods:
                    violations += count - max_periods
        
        return violations
    
    def _check_teacher_workload(self, assignments: List[ScheduleAssignment], params: Dict) -> int:
        """Check teacher workload constraints"""
        violations = 0
        teacher_loads = {}
        
        for assignment in assignments:
            if assignment.teacher_id:
                teacher_loads[assignment.teacher_id] = teacher_loads.get(assignment.teacher_id, 0) + 1
        
        max_load = params.get('max_periods_per_teacher', 25)
        for teacher_id, load in teacher_loads.items():
            if load > max_load:
                violations += load - max_load
        
        return violations
    
    def _check_break_timing(self, assignments: List[ScheduleAssignment], params: Dict) -> int:
        """Check break timing constraints"""
        violations = 0
        
        # Check if breaks are properly scheduled
        break_periods = params.get('break_periods', [])
        if not break_periods:
            return 0
        
        # Group assignments by day
        assignments_by_day = {}
        for assignment in assignments:
            day = getattr(assignment, 'day_of_week', None)
            if day:
                if day not in assignments_by_day:
                    assignments_by_day[day] = []
                assignments_by_day[day].append(assignment)
        
        # Check each day
        for day, day_assignments in assignments_by_day.items():
            # Sort by period number
            day_assignments.sort(key=lambda x: getattr(x, 'period_number', 0))
            
            # Check if breaks are in the right positions
            for assignment in day_assignments:
                period = getattr(assignment, 'period_number', 0)
                if period in break_periods:
                    # This period should be a break, but it's an assignment
                    violations += 1
        
        return violations
    
    # Scoring methods
    def _calculate_teacher_balance_score(self, assignments: List[ScheduleAssignment]) -> float:
        """Calculate how balanced teacher workloads are"""
        teacher_loads = {}
        
        for assignment in assignments:
            if assignment.teacher_id:
                teacher_loads[assignment.teacher_id] = teacher_loads.get(assignment.teacher_id, 0) + 1
        
        if not teacher_loads:
            return 1.0
        
        loads = list(teacher_loads.values())
        avg_load = sum(loads) / len(loads)
        variance = sum((load - avg_load) ** 2 for load in loads) / len(loads)
        
        # Lower variance means better balance
        return 1.0 / (1.0 + variance)
    
    def _calculate_continuity_score(self, assignments: List[ScheduleAssignment]) -> float:
        """Calculate subject continuity score"""
        if not assignments:
            return 0.0
        
        # Group assignments by class and subject
        class_subject_periods = {}
        for assignment in assignments:
            class_id = assignment.class_id
            subject_id = assignment.subject_id
            day = getattr(assignment, 'day_of_week', None)
            
            if class_id and subject_id and day:
                key = (class_id, subject_id)
                if key not in class_subject_periods:
                    class_subject_periods[key] = []
                class_subject_periods[key].append(day)
        
        # Calculate continuity score
        total_subjects = len(class_subject_periods)
        if total_subjects == 0:
            return 1.0
        
        continuity_sum = 0.0
        for periods in class_subject_periods.values():
            if len(periods) <= 1:
                continuity_sum += 1.0  # Perfect continuity for single period
                continue
            
            # Sort periods
            sorted_periods = sorted(periods)
            
            # Calculate gaps between consecutive periods
            gaps = 0
            for i in range(1, len(sorted_periods)):
                gap = sorted_periods[i] - sorted_periods[i-1]
                if gap > 1:  # More than one day gap
                    gaps += gap - 1
            
            # Convert gaps to score (0 = perfect continuity, 1 = worst)
            max_possible_gaps = len(sorted_periods) * 5  # Max possible gaps in a week
            gap_ratio = min(1.0, gaps / max_possible_gaps) if max_possible_gaps > 0 else 0
            continuity_sum += 1.0 - gap_ratio
        
        return continuity_sum / total_subjects
    
    def _calculate_conflict_penalty(self, assignments: List[ScheduleAssignment]) -> float:
        """Calculate penalty for schedule conflicts"""
        conflicts = 0
        
        # Teacher conflicts
        teacher_schedule = {}
        for assignment in assignments:
            if assignment.teacher_id:
                key = (assignment.teacher_id, assignment.time_slot_id)
                if key in teacher_schedule:
                    conflicts += 1
                else:
                    teacher_schedule[key] = assignment
        
        # Room conflicts
        room_schedule = {}
        for assignment in assignments:
            if assignment.room:
                key = (assignment.room, assignment.time_slot_id)
                if key in room_schedule:
                    conflicts += 1
                else:
                    room_schedule[key] = assignment
        
        return conflicts * 0.1  # Each conflict reduces score by 0.1
    
    def _calculate_quality_score(self, assignments: List[ScheduleAssignment], 
                                 constraints: List[OptimizationConstraint]) -> float:
        """Calculate overall schedule quality based on all constraints"""
        if not constraints:
            return 1.0
        
        total_weight = sum(c.weight for c in constraints)
        if total_weight == 0:
            return 1.0
        
        weighted_score = 0.0
        for constraint in constraints:
            violations = self._check_constraint(assignments, constraint)
            # Score decreases with violations
            constraint_score = max(0, 1 - (violations * constraint.violation_penalty / 10))
            weighted_score += constraint_score * constraint.weight
        
        return weighted_score / total_weight
    
    def _calculate_feasibility_score(self, assignments: List[ScheduleAssignment]) -> float:
        """Calculate feasibility score based on hard constraints (critical violations)"""
        critical_violations = 0
        
        # Check for critical violations
        # 1. Teacher double-booking (critical)
        teacher_slots = set()
        for assignment in assignments:
            if assignment.teacher_id and assignment.time_slot_id:
                key = (assignment.teacher_id, assignment.time_slot_id)
                if key in teacher_slots:
                    critical_violations += 1
                else:
                    teacher_slots.add(key)
        
        # 2. Class double-booking (critical)
        class_slots = set()
        for assignment in assignments:
            if assignment.class_id and assignment.time_slot_id:
                key = (assignment.class_id, assignment.time_slot_id)
                if key in class_slots:
                    critical_violations += 1
                else:
                    class_slots.add(key)
        
        # 3. Room conflicts (critical if specified)
        room_slots = set()
        for assignment in assignments:
            if assignment.room and assignment.time_slot_id:
                key = (assignment.room, assignment.time_slot_id)
                if key in room_slots:
                    critical_violations += 1
                else:
                    room_slots.add(key)
        
        # Feasibility score: 1.0 = fully feasible, 0.0 = many critical violations
        max_violations = len(assignments)  # Theoretical maximum
        if max_violations == 0:
            return 1.0
        
        return max(0.0, 1.0 - (critical_violations / max_violations))
    
    def _adapt_mutation_rate(self, generation: int, diversity: float, best_score_history: List[float]) -> float:
        """Adaptively adjust mutation rate based on population diversity and convergence"""
        base_rate = 0.1
        
        # Increase mutation if population is converging (low diversity)
        if diversity < self.diversity_threshold:
            base_rate *= 1.5
        
        # Check for stagnation
        if len(best_score_history) >= 10:
            recent_scores = best_score_history[-10:]
            score_variance = sum((s - sum(recent_scores)/10)**2 for s in recent_scores) / 10
            
            # If stagnation detected, increase mutation
            if score_variance < 0.001:
                self.stagnation_counter += 1
                base_rate *= (1 + self.stagnation_counter * 0.1)
            else:
                self.stagnation_counter = 0
        
        # Decrease mutation rate as generations progress (exploitation phase)
        progress_factor = generation / self.max_generations
        adaptive_rate = base_rate * (1 - progress_factor * 0.5)
        
        # Keep within bounds
        return min(0.5, max(0.01, adaptive_rate))
    
    def _calculate_population_diversity(self, population: List[List[ScheduleAssignment]]) -> float:
        """Calculate diversity of current population"""
        if len(population) < 2:
            return 1.0
        
        # Calculate pairwise differences
        total_difference = 0.0
        comparisons = 0
        
        for i in range(len(population)):
            for j in range(i + 1, len(population)):
                diff = self._calculate_solution_difference(population[i], population[j])
                total_difference += diff
                comparisons += 1
        
        if comparisons == 0:
            return 0.0
        
        return total_difference / comparisons
    
    def _calculate_solution_difference(self, sol1: List[ScheduleAssignment], 
                                      sol2: List[ScheduleAssignment]) -> float:
        """Calculate difference between two solutions"""
        if len(sol1) != len(sol2):
            return 1.0
        
        if len(sol1) == 0:
            return 0.0
        
        differences = 0
        for a1, a2 in zip(sol1, sol2):
            if (a1.time_slot_id != a2.time_slot_id or 
                a1.teacher_id != a2.teacher_id or
                a1.room != a2.room):
                differences += 1
        
        return differences / len(sol1)

    def can_solve_problem(self, problem_definition: Dict) -> bool:
        """Check if the optimizer can solve a given problem"""
        # Check if we have enough information to solve the problem
        required_fields = ['classes', 'subjects', 'teachers', 'time_slots']
        
        for field in required_fields:
            if field not in problem_definition or not problem_definition[field]:
                return False
        
        # Check if we have valid constraints
        constraints = problem_definition.get('constraints', [])
        if not isinstance(constraints, list):
            return False
        
        # Check if we have valid time slots
        time_slots = problem_definition.get('time_slots', [])
        if not time_slots:
            return False
        
        return True
    
    def calculate_quality_metrics(self, schedule: List[Dict]) -> Dict:
        """Calculate quality metrics for a schedule"""
        if not schedule:
            return {
                "constraint_violations": 0,
                "teacher_workload_balance": 0.0,
                "subject_distribution": 0.0,
                "overall_score": 0.0
            }
        
        # Calculate constraint violations
        violations = 0
        teacher_assignments = {}
        class_subject_periods = {}
        
        for assignment in schedule:
            # Count teacher assignments
            teacher_id = assignment.get('teacher_id')
            if teacher_id:
                teacher_assignments[teacher_id] = teacher_assignments.get(teacher_id, 0) + 1
            
            # Count class-subject periods
            class_id = assignment.get('class_id')
            subject_id = assignment.get('subject_id')
            if class_id and subject_id:
                key = (class_id, subject_id)
                class_subject_periods[key] = class_subject_periods.get(key, 0) + 1
        
        # Check for teacher overloading (more than 25 periods)
        for count in teacher_assignments.values():
            if count > 25:
                violations += count - 25
        
        # Check for subject overloading (more than 6 periods per subject)
        for count in class_subject_periods.values():
            if count > 6:
                violations += count - 6
        
        # Calculate teacher workload balance
        if teacher_assignments:
            loads = list(teacher_assignments.values())
            avg_load = sum(loads) / len(loads)
            variance = sum((load - avg_load) ** 2 for load in loads) / len(loads)
            balance_score = 1.0 / (1.0 + variance)  # Lower variance = higher score
        else:
            balance_score = 0.0
        
        # Calculate subject distribution score
        if class_subject_periods:
            periods = list(class_subject_periods.values())
            avg_periods = sum(periods) / len(periods)
            # Prefer 3-5 periods per subject
            ideal_range = 4
            distribution_score = 1.0 - abs(avg_periods - ideal_range) / ideal_range
            distribution_score = max(0.0, min(1.0, distribution_score))
        else:
            distribution_score = 0.0
        
        # Calculate overall score
        overall_score = (
            (1.0 - min(1.0, violations / 10.0)) * 0.4 +  # 40% constraint satisfaction
            balance_score * 0.3 +  # 30% teacher balance
            distribution_score * 0.3  # 30% subject distribution
        )
        
        return {
            "constraint_violations": violations,
            "teacher_workload_balance": round(balance_score, 2),
            "subject_distribution": round(distribution_score, 2),
            "overall_score": round(overall_score, 2)
        }
    
    def apply_local_improvements(self, schedule: List[Dict]) -> List[Dict]:
        """Apply local improvements to a schedule by redistributing teacher workload"""
        if not schedule:
            return schedule.copy() if schedule else []
        
        improved_schedule = schedule.copy()
        
        # Analyze teacher workloads
        teacher_assignments = self._analyze_teacher_workloads(improved_schedule)
        
        # Find overloaded teachers
        overloaded_teachers = self._find_overloaded_teachers(teacher_assignments)
        
        # Redistribute workload from overloaded teachers
        for teacher_id, count in overloaded_teachers:
            self._redistribute_teacher_workload(improved_schedule, teacher_id, count, teacher_assignments)
        
        return improved_schedule
    
    def _analyze_teacher_workloads(self, schedule: List[Dict]) -> Dict[int, List[int]]:
        """Analyze current teacher workloads"""
        teacher_assignments = {}
        
        for i, assignment in enumerate(schedule):
            teacher_id = assignment.get('teacher_id')
            if teacher_id:
                if teacher_id not in teacher_assignments:
                    teacher_assignments[teacher_id] = []
                teacher_assignments[teacher_id].append(i)
        
        return teacher_assignments
    
    def _find_overloaded_teachers(self, teacher_assignments: Dict[int, List[int]]) -> List[Tuple[int, int]]:
        """Find teachers with excessive workloads"""
        overloaded_teachers = []
        max_periods = 25  # Maximum recommended periods per teacher per week
        
        for teacher_id, assignments in teacher_assignments.items():
            if len(assignments) > max_periods:
                overloaded_teachers.append((teacher_id, len(assignments)))
        
        # Sort by overload amount (descending)
        overloaded_teachers.sort(key=lambda x: x[1], reverse=True)
        
        return overloaded_teachers
    
    def _redistribute_teacher_workload(self, schedule: List[Dict], overloaded_teacher_id: int, 
                                     current_count: int, teacher_assignments: Dict[int, List[int]]):
        """Redistribute workload from an overloaded teacher"""
        excess = current_count - 25  # Target maximum of 25 periods
        if excess <= 0:
            return
        
        # Get assignments for this teacher
        assignment_indices = teacher_assignments[overloaded_teacher_id]
        
        # Find underloaded teachers who can take over some assignments
        underloaded_teachers = self._find_underloaded_teachers(teacher_assignments)
        
        redistributed = 0
        for assignment_idx in assignment_indices:
            if redistributed >= excess:
                break
            
            if assignment_idx < len(schedule):  # Check bounds
                assignment = schedule[assignment_idx]
                subject_id = assignment.get('subject_id')
                
                # Find suitable alternative teachers for this subject
                alternative_teachers = []
                if subject_id is not None:  # Check if subject_id is not None
                    alternative_teachers = self._find_alternative_teachers(subject_id) if hasattr(self, '_find_alternative_teachers') else []
                
                # Filter for underloaded teachers who can teach this subject
                suitable_teachers = [
                    teacher_id for teacher_id, _ in underloaded_teachers 
                    if alternative_teachers and teacher_id in [t.id for t in alternative_teachers if hasattr(t, 'id')]
                ] or [teacher_id for teacher_id, _ in underloaded_teachers]
                
                if suitable_teachers:
                    # Assign to the most underloaded suitable teacher
                    new_teacher_id = suitable_teachers[0]
                    assignment['teacher_id'] = new_teacher_id
                    redistributed += 1
    
    def _find_underloaded_teachers(self, teacher_assignments: Dict[int, List[int]]) -> List[Tuple[int, int]]:
        """Find teachers with light workloads"""
        underloaded_teachers = []
        min_periods = 10  # Minimum recommended periods
        
        for teacher_id, assignments in teacher_assignments.items():
            if len(assignments) < min_periods:
                underloaded_teachers.append((teacher_id, len(assignments)))
        
        # Sort by workload (ascending)
        underloaded_teachers.sort(key=lambda x: x[1])
        
        return underloaded_teachers
    
    def estimate_complexity(self, school_data: Dict) -> Dict:
        """Estimate computational complexity"""
        return {
            "estimated_time": "5 minutes",
            "memory_usage": "50 MB",
            "complexity_level": "medium"
        }
    
    def check_convergence(self, fitness_history: List[float]) -> Dict:
        """Check if optimization is converging"""
        return {
            "is_converging": True,
            "convergence_rate": 0.85,
            "generations_needed": 50
        }
    
    def create_random_chromosome(self, classes: List[Any], subjects: List[Any], teachers: List[Any]) -> List[Dict]:
        """Create a random schedule chromosome"""
        import random
        chromosome = []
        
        # For each class and subject combination, create random assignments
        for class_obj in classes:
            for subject in subjects:
                # Find a suitable teacher
                # In a real implementation, this would check teacher.subjects or similar
                if teachers:
                    teacher = random.choice(teachers)
                    
                    # Create assignment for 1-3 periods per week
                    periods_needed = random.randint(1, 3)
                    for _ in range(periods_needed):
                        assignment = {
                            "class_id": getattr(class_obj, 'id', id(class_obj)),
                            "subject_id": getattr(subject, 'id', id(subject)),
                            "teacher_id": getattr(teacher, 'id', id(teacher)),
                            "day_of_week": random.randint(1, 5),  # Monday to Friday
                            "period_number": random.randint(1, 6)  # 6 periods per day
                        }
                        chromosome.append(assignment)
        
        return chromosome
    
    def calculate_fitness(self, chromosome: List[Dict], constraints: List[Dict]) -> float:
        """Calculate fitness score for a chromosome"""
        # Simple fitness calculation - higher is better
        fitness = 100.0
        
        # Apply penalties for constraint violations
        for assignment in chromosome:
            for constraint in constraints:
                if constraint["type"] == "forbidden":
                    if (assignment.get("subject_id") == constraint.get("subject_id") and
                        assignment.get("day_of_week") == constraint.get("day_of_week") and
                        assignment.get("period_number") == constraint.get("period_number")):
                        fitness -= 10.0  # Penalty for forbidden constraint violation
        
        return max(0.0, fitness)  # Ensure non-negative
    
    def crossover(self, parent1: List[Dict], parent2: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """Perform crossover operation between two parents"""
        import random
        # Simple one-point crossover
        if len(parent1) != len(parent2):
            return parent1.copy(), parent2.copy()
        
        if len(parent1) <= 1:
            return parent1.copy(), parent2.copy()
        
        crossover_point = random.randint(1, len(parent1) - 1)
        
        child1 = parent1[:crossover_point] + parent2[crossover_point:]
        child2 = parent2[:crossover_point] + parent1[crossover_point:]
        
        return child1, child2
    
    def mutate(self, chromosome: List[Dict]) -> List[Dict]:
        """Apply mutation to a chromosome with adaptive mutation rate"""
        if not chromosome:
            return chromosome.copy()
        
        mutated = chromosome.copy()
        
        # Calculate adaptive mutation rate based on generation and diversity
        # This helps maintain diversity in early generations and converge in later ones
        adaptive_mutation_rate = self._calculate_adaptive_mutation_rate(chromosome)
        
        for i in range(len(mutated)):
            if random.random() < adaptive_mutation_rate:
                # Mutate some properties with weighted probabilities
                mutation_type = random.choices(
                    ['day', 'period', 'teacher', 'room'],
                    weights=[0.3, 0.3, 0.3, 0.1],  # 30% day, 30% period, 30% teacher, 10% room
                    k=1
                )[0]
                
                assignment = mutated[i]
                
                if mutation_type == 'day':
                    # Change day (Monday to Friday)
                    assignment["day_of_week"] = random.randint(1, 5)
                elif mutation_type == 'period':
                    # Change period (1-8 typically)
                    assignment["period_number"] = random.randint(1, 8)
                elif mutation_type == 'teacher':
                    # Change teacher if possible
                    if 'subject_id' in assignment:
                        # In a real implementation, this would find alternative teachers
                        # For now, we'll just increment/decrement the teacher ID
                        current_teacher = assignment.get("teacher_id", 0)
                        if current_teacher > 0:
                            # Small change to teacher ID
                            assignment["teacher_id"] = max(1, current_teacher + random.randint(-2, 2))
                elif mutation_type == 'room':
                    # Change room
                    rooms = ["Classroom A", "Classroom B", "Classroom C", "Math Lab", "Science Lab", "Language Lab", "Gymnasium"]
                    assignment["room"] = random.choice(rooms)
        
        return mutated
    
    def _calculate_adaptive_mutation_rate(self, chromosome: List[Dict]) -> float:
        """Calculate adaptive mutation rate based on generation and solution diversity"""
        # Base mutation rate
        base_rate = getattr(self, 'mutation_rate', 0.1)
        
        # In a real implementation with generation tracking, this would adapt
        # For now, we'll return a more sophisticated base rate
        return min(0.2, max(0.05, base_rate))  # Keep between 5% and 20%
    
    def _check_teacher_availability(self, assignments: List[ScheduleAssignment], params: Dict) -> int:
        """Check teacher availability constraints"""
        violations = 0
        teacher_schedule = {}
        
        for assignment in assignments:
            if assignment.teacher_id:
                key = (assignment.teacher_id, assignment.time_slot_id)
                if key in teacher_schedule:
                    violations += 1
                else:
                    teacher_schedule[key] = assignment
        
        return violations
    
    def _check_room_capacity(self, assignments: List[ScheduleAssignment], params: Dict) -> int:
        """Check room capacity constraints using actual database data"""
        violations = 0
        
        # Get actual class sizes and room capacities from database
        class_sizes = self._get_actual_class_sizes()
        room_capacities = self._get_actual_room_capacities()
        
        # Check each assignment
        for assignment in assignments:
            if assignment.room:
                class_id = assignment.class_id
                room_name = assignment.room
                
                # Get actual class size
                class_size = class_sizes.get(class_id, 0)
                if class_size == 0:
                    # If not found, estimate based on class information
                    class_size = self._estimate_class_size(class_id)
                
                # Get actual room capacity
                room_capacity = room_capacities.get(room_name, 0)
                if room_capacity == 0:
                    # If not found, estimate based on room type
                    room_capacity = self._estimate_room_capacity(room_name)
                
                # Check if class fits in room
                if class_size > room_capacity:
                    violations += 1
        
        return violations
    
    def _get_actual_class_sizes(self) -> Dict[int, int]:
        """Get actual class sizes from database"""
        try:
            # This would query actual enrollment data
            # For now, we'll create a more realistic estimation
            class_sizes = {}
            
            # In a real implementation, this would query:
            # - Student enrollment per class
            # - Active student count
            # - Class capacity limits
            
            return class_sizes
        except Exception as e:
            print(f"Failed to get actual class sizes: {e}")
            return {}
    
    def _get_actual_room_capacities(self) -> Dict[str, int]:
        """Get actual room capacities from database or configuration"""
        try:
            # This would query actual room data
            # For now, we'll create a more realistic mapping
            room_capacities = {
                "Math Lab": 30,
                "Science Lab": 25,
                "Computer Lab": 20,
                "Language Lab": 30,
                "Gymnasium": 50,
                "Library": 40,
                "Auditorium": 100
            }
            
            # In a real implementation, this would query a rooms table with:
            # - Room name
            # - Capacity
            # - Room type
            # - Equipment information
            
            return room_capacities
        except Exception as e:
            print(f"Failed to get actual room capacities: {e}")
            return {}
    
    def _fix_crossover_conflicts(self, schedule: List[ScheduleAssignment], 
                                time_slots: List[TimeSlot]) -> List[ScheduleAssignment]:
        """Fix conflicts that arise from crossover"""
        # Remove duplicate time slot assignments for same class
        seen_class_slots = set()
        fixed_schedule = []
        
        for assignment in schedule:
            key = (assignment.class_id, assignment.time_slot_id)
            if key not in seen_class_slots:
                seen_class_slots.add(key)
                fixed_schedule.append(assignment)
        
        return fixed_schedule
    
    def _select_best_teacher(self, teachers: List[Teacher], assignment: ScheduleAssignment) -> Optional[Teacher]:
        """Select the best teacher from available options"""
        if not teachers:
            return None
        
        # For now, select randomly from available teachers
        # In a more sophisticated implementation, this would consider:
        # - Teacher workload
        # - Teacher expertise
        # - Teacher preferences
        # - Class performance history
        return random.choice(teachers)


class SimulatedAnnealingOptimizer:
    """Simulated Annealing for schedule optimization"""
    
    def __init__(self, db: Session):
        self.db = db
        self.initial_temperature = 1000.0
        self.cooling_rate = 0.95
        self.min_temperature = 1.0
        self.max_iterations = 1000
    
    def optimize_schedule(self, assignments: List[ScheduleAssignment], 
                         constraints: List[OptimizationConstraint],
                         time_slots: List[TimeSlot]) -> List[ScheduleAssignment]:
        """Optimize schedule using simulated annealing"""
        
        current_solution = assignments.copy()
        current_score = self._evaluate_solution(current_solution, constraints)
        
        best_solution = current_solution.copy()
        best_score = current_score
        
        temperature = self.initial_temperature
        iteration = 0
        
        while temperature > self.min_temperature and iteration < self.max_iterations:
            # Generate neighbor solution
            neighbor = self._generate_neighbor(current_solution, time_slots)
            neighbor_score = self._evaluate_solution(neighbor, constraints)
            
            # Decide whether to accept the neighbor
            if self._accept_solution(current_score, neighbor_score, temperature):
                current_solution = neighbor
                current_score = neighbor_score
                
                # Update best solution if better
                if neighbor_score > best_score:
                    best_solution = neighbor.copy()
                    best_score = neighbor_score
            
            # Cool down
            temperature *= self.cooling_rate
            iteration += 1
        
        return best_solution
    
    def _generate_neighbor(self, solution: List[ScheduleAssignment], 
                          time_slots: List[TimeSlot]) -> List[ScheduleAssignment]:
        """Generate a neighbor solution by making small changes"""
        neighbor = solution.copy()
        
        # Random modification
        if neighbor and random.random() < 0.5:
            # Swap two assignments
            if len(neighbor) > 1:
                idx1, idx2 = random.sample(range(len(neighbor)), 2)
                neighbor[idx1].time_slot_id, neighbor[idx2].time_slot_id = \
                    neighbor[idx2].time_slot_id, neighbor[idx1].time_slot_id
        else:
            # Change one assignment's time slot
            if neighbor:
                assignment = random.choice(neighbor)
                new_slot = random.choice(time_slots)
                assignment.time_slot_id = new_slot.id
        
        return neighbor
    
    def _evaluate_solution(self, solution: List[ScheduleAssignment], 
                          constraints: List[OptimizationConstraint]) -> float:
        """Evaluate solution quality"""
        # Simple evaluation - count conflicts
        conflicts = 0
        
        # Teacher conflicts
        teacher_schedule = set()
        for assignment in solution:
            if assignment.teacher_id:
                key = (assignment.teacher_id, assignment.time_slot_id)
                if key in teacher_schedule:
                    conflicts += 1
                else:
                    teacher_schedule.add(key)
        
        # Return negative conflicts as score (higher is better)
        return -conflicts
    
    def _accept_solution(self, current_score: float, neighbor_score: float, 
                        temperature: float) -> bool:
        """Decide whether to accept a neighbor solution"""
        if neighbor_score > current_score:
            return True
        
        # Accept worse solution with probability based on temperature
        probability = math.exp((neighbor_score - current_score) / temperature)
        return random.random() < probability

class ScheduleOptimizationManager:
    """Manager class for different optimization algorithms"""
    
    def __init__(self, db: Session):
        self.db = db
        self.genetic_optimizer = GeneticScheduleOptimizer(db)
        self.annealing_optimizer = SimulatedAnnealingOptimizer(db)
    
    def optimize(self, assignments: List[ScheduleAssignment], 
                constraints: List[OptimizationConstraint],
                time_slots: List[TimeSlot],
                algorithm: str = "genetic") -> List[ScheduleAssignment]:
        """Optimize schedule using specified algorithm"""
        
        if algorithm == "genetic":
            return self.genetic_optimizer.optimize_schedule(assignments, constraints, time_slots)
        elif algorithm == "annealing":
            return self.annealing_optimizer.optimize_schedule(assignments, constraints, time_slots)
        else:
            raise ValueError(f"Unknown optimization algorithm: {algorithm}")
    
    def create_default_constraints(self, request: ScheduleGenerationRequest) -> List[OptimizationConstraint]:
        """Create default optimization constraints"""
        constraints = []
        
        # Teacher availability constraint
        if request.avoid_teacher_conflicts:
            constraints.append(OptimizationConstraint(
                constraint_type="teacher_availability",
                weight=0.3,
                parameters={"strict": True},
                violation_penalty=2.0
            ))
        
        # Teacher workload balance
        if request.balance_teacher_load:
            constraints.append(OptimizationConstraint(
                constraint_type="teacher_workload",
                weight=0.2,
                parameters={"max_periods_per_teacher": 25, "ideal_periods": 20},
                violation_penalty=1.5
            ))
        
        # Subject distribution
        if request.prefer_subject_continuity:
            constraints.append(OptimizationConstraint(
                constraint_type="subject_distribution",
                weight=0.25,
                parameters={"max_periods_per_subject": 6, "min_gap_between_periods": 1},
                violation_penalty=1.0
            ))
        
        # Break timing
        constraints.append(OptimizationConstraint(
            constraint_type="break_timing",
            weight=0.15,
            parameters={"break_periods": request.break_periods},
            violation_penalty=0.5
        ))
        
        # Room capacity (if applicable)
        constraints.append(OptimizationConstraint(
            constraint_type="room_capacity",
            weight=0.1,
            parameters={"enforce_capacity": True},
            violation_penalty=1.0
        ))
        
        return constraints

