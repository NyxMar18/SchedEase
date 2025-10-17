package com.scheduling.repository;

import com.scheduling.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    
    Optional<Subject> findByName(String name);
    
    Optional<Subject> findByCode(String code);
    
    List<Subject> findByRequiredRoomType(String roomType);
    
    @Query("SELECT s FROM Subject s ORDER BY s.priority DESC, s.name ASC")
    List<Subject> findAllOrderByPriority();
    
}

