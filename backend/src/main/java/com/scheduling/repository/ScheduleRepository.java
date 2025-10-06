package com.scheduling.repository;

import com.scheduling.model.Classroom;
import com.scheduling.model.DayOfWeek;
import com.scheduling.model.Schedule;
import com.scheduling.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    
    List<Schedule> findByTeacher(Teacher teacher);
    
    List<Schedule> findByClassroom(Classroom classroom);
    
    List<Schedule> findByDate(LocalDate date);
    
    List<Schedule> findByDayOfWeek(DayOfWeek dayOfWeek);
    
    @Query("SELECT s FROM Schedule s WHERE s.classroom = :classroom AND s.date = :date " +
           "AND ((s.startTime <= :startTime AND s.endTime > :startTime) OR " +
           "(s.startTime < :endTime AND s.endTime >= :endTime) OR " +
           "(s.startTime >= :startTime AND s.endTime <= :endTime))")
    List<Schedule> findConflictingClassroomSchedules(@Param("classroom") Classroom classroom,
                                                    @Param("date") LocalDate date,
                                                    @Param("startTime") LocalTime startTime,
                                                    @Param("endTime") LocalTime endTime);
    
    @Query("SELECT s FROM Schedule s WHERE s.teacher = :teacher AND s.date = :date " +
           "AND ((s.startTime <= :startTime AND s.endTime > :startTime) OR " +
           "(s.startTime < :endTime AND s.endTime >= :endTime) OR " +
           "(s.startTime >= :startTime AND s.endTime <= :endTime))")
    List<Schedule> findConflictingTeacherSchedules(@Param("teacher") Teacher teacher,
                                                  @Param("date") LocalDate date,
                                                  @Param("startTime") LocalTime startTime,
                                                  @Param("endTime") LocalTime endTime);
    
    @Query("SELECT s FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate " +
           "ORDER BY s.date, s.startTime")
    List<Schedule> findSchedulesBetweenDates(@Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);
}
