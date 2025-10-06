package com.scheduling.repository;

import com.scheduling.model.DayOfWeek;
import com.scheduling.model.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    
    Optional<Teacher> findByEmail(String email);
    
    List<Teacher> findBySubject(String subject);
    
    @Query("SELECT t FROM Teacher t WHERE t.subject = :subject AND :day MEMBER OF t.availableDays " +
           "AND t.availableStartTime <= :startTime AND t.availableEndTime >= :endTime")
    List<Teacher> findAvailableTeachers(@Param("subject") String subject, 
                                       @Param("day") DayOfWeek day,
                                       @Param("startTime") LocalTime startTime, 
                                       @Param("endTime") LocalTime endTime);
    
    @Query("SELECT t FROM Teacher t WHERE :day MEMBER OF t.availableDays " +
           "AND t.availableStartTime <= :startTime AND t.availableEndTime >= :endTime")
    List<Teacher> findTeachersByAvailability(@Param("day") DayOfWeek day,
                                           @Param("startTime") LocalTime startTime, 
                                           @Param("endTime") LocalTime endTime);
}
