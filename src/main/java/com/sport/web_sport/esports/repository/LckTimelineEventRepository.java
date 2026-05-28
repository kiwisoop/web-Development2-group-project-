package com.sport.web_sport.esports.repository;

import com.sport.web_sport.esports.entity.LckTimelineEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LckTimelineEventRepository extends JpaRepository<LckTimelineEvent, Long> {

    List<LckTimelineEvent> findByGameGameIdOrderByEventTime(Long gameId);
}
